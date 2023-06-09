import {
  Account,
  Comment,
  File,
  Post,
  PrismaClient,
  ProfileImage,
  Reply,
  User
} from '@prisma/client';
import { ClientUser } from '../../interfaces/user';
import { convertPgUserToClientUser } from '../../utils/user';
import {
  convertPgCommentsToClientComments,
  convertPgPostToClientPost
} from '../../utils/post';
import { ClientPost, ClientMediaFile } from '../../interfaces/post';
import {
  deleteFileFromS3,
  getFileFromS3,
  uploadFileToS3
} from '../s3/s3-service';
import { MulterFile } from '../../controllers/post-controller';
import crypto from 'crypto';
import sharp from 'sharp';
import {
  cleanFilename,
  safeDecodeURIComponent,
  trimFilename
} from '../../utils/text';
import { Request } from 'express';

const postBucketName = process.env.POST_BUCKET_NAME!;
const profileImageBucketName = process.env.PROFILE_IMAGE_BUCKET_NAME!;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});
const randomBytes = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

// User

export const fetchUser = async (userId: string): Promise<ClientUser> => {
  const pgUser = await getPgUserById(userId);
  return await convertPgUserToClientUser(pgUser);
};

export const getPgUserById = async (userId: string): Promise<User> => {
  const pgUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!pgUser) {
    throw Error('[Postgre] User not found!');
  }
  return pgUser;
};

export const getPgUserBySub = async (userSub: string): Promise<User> => {
  const pgUser = await prisma.user.findUnique({ where: { sub: userSub } });
  if (!pgUser) {
    throw Error('[Postgre] User not found!');
  }
  return pgUser;
};

export const getPgProfileImage = async (
  userId: string
): Promise<ProfileImage | null> => {
  const pgProfileImage = await prisma.profileImage.findUnique({
    where: { userId }
  });
  return pgProfileImage;
};

export const updatePgUser = async (
  userId: string,
  data: any
): Promise<ClientUser> => {
  const updatedUser = await prisma.user.update({
    where: {
      id: userId
    },
    data
  });

  const updatedPgUser = convertPgUserToClientUser(updatedUser);
  return updatedPgUser;
};

export const updateUserProfile = async (
  req: Request,
  userId: string
): Promise<ClientUser> => {
  const file = req.file as MulterFile | undefined;
  const bio = req.body.bio as string | undefined;
  if (!bio && !file) {
    throw new Error('No user bio and file to update');
  }

  if (file) {
    // Delete existing profile image in s3
    const existingProfileImage = await prisma.profileImage.findUnique({
      where: {
        userId
      }
    });

    if (existingProfileImage) {
      const deleteObjectParams = {
        Bucket: profileImageBucketName,
        Key: existingProfileImage.fileKey
      };
      await deleteFileFromS3(deleteObjectParams);
    }

    // Store profile image in S3

    const s3FileKey = randomBytes();
    const formattedFile = await sharp(file.buffer).toBuffer();
    const params = {
      Bucket: profileImageBucketName,
      Key: s3FileKey,
      Body: formattedFile,
      ContentType: file.mimetype
    };

    await uploadFileToS3(params);

    // Delete existing profile image entry

    await prisma.profileImage.deleteMany({
      where: {
        userId
      }
    });

    // Create a new profile image entry

    const newFileName = trimFilename(
      cleanFilename(safeDecodeURIComponent(file.originalname)),
      120
    );

    const newProfileImage = {
      fileName: newFileName,
      size: file.size,
      mimeType: file.mimetype,
      fileKey: s3FileKey
    };

    await prisma.profileImage.create({
      data: {
        ...newProfileImage,
        user: {
          connect: { id: userId }
        }
      }
    });
  }

  if (bio) {
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        bio
      }
    });
  }

  const pgUser = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!pgUser) {
    throw new Error('[Postgres] User not found');
  }
  return await convertPgUserToClientUser(pgUser);
};

// Account

export const getPgAccountByUserId = async (
  userId: string
): Promise<Account> => {
  const pgAccount = await prisma.account.findUnique({
    where: { ownerId: userId }
  });
  if (!pgAccount) {
    throw Error('[Postgre] account not found!');
  }
  return pgAccount;
};

// Post

export const getAllPosts = async (): Promise<ClientPost[]> => {
  const postsFromPrisma = await prisma.post.findMany({
    orderBy: [{ createdAt: 'desc' }],
    include: {
      files: true
    }
  });

  return await getClientPosts(postsFromPrisma);
};

export const createPost = async (req: Request): Promise<ClientPost> => {
  const files = req.files as MulterFile[];

  const newFiles: ClientMediaFile[] = [];
  // Upload files to S3
  for (const file of files) {
    const portraitFileKey = randomBytes();
    const squareFileKey = randomBytes();
    const resizedPortraitFile = await sharp(file.buffer)
      .resize({ height: 1920, width: 1080, fit: 'contain' })
      .toBuffer();
    const resizedSquareFile = await sharp(file.buffer)
      .resize({ height: 1080, width: 1080, fit: 'contain' })
      .toBuffer();

    // Upload resized portrait file to S3
    const portraitParams = {
      Bucket: postBucketName,
      Key: portraitFileKey,
      Body: resizedPortraitFile,
      ContentType: file.mimetype
    };

    await uploadFileToS3(portraitParams);

    // Upload resized square file to S3
    const squareParams = {
      Bucket: postBucketName,
      Key: squareFileKey,
      Body: resizedSquareFile,
      ContentType: file.mimetype
    };
    await uploadFileToS3(squareParams);

    const newFileName = trimFilename(
      cleanFilename(safeDecodeURIComponent(file.originalname)),
      120
    );
    const altPropertyName = 'fileAltText-' + file.originalname;
    const altText = req.body[altPropertyName];

    newFiles.push({
      fileName: newFileName,
      size: file.size,
      mimetype: file.mimetype,
      alt: altText,
      portraitFileKey,
      squareFileKey
    });
  }

  // Store data on DB

  const pgPost = await prisma.post.create({
    data: {
      authorId: req.body.authorId,
      caption: req.body.caption,
      files: {
        create: newFiles
      }
    }
  });
  return await convertPgPostToClientPost(pgPost);
};

export const deletePost = async (postId: string, userId: string) => {
  // Delete files from s3
  const files = await prisma.file.findMany({
    where: {
      postId
    }
  });

  for (const file of files) {
    const deletePortraitFileParams = {
      Bucket: postBucketName,
      Key: file.portraitFileKey
    };
    await deleteFileFromS3(deletePortraitFileParams);

    const deleteSquareFileParams = {
      Bucket: postBucketName,
      Key: file.squareFileKey
    };
    await deleteFileFromS3(deleteSquareFileParams);
  }

  // Delete related information in DB
  await prisma.like.deleteMany({ where: { postId } });
  await prisma.comment.deleteMany({ where: { postId } });
  await prisma.post.delete({ where: { id: postId } });
  const updatedPosts = await getAllPosts();
  const updatedPgUser = await getPgUserById(userId);
  const updatedUser = await convertPgUserToClientUser(updatedPgUser);
  return { updatedPosts, updatedUser };
};

export const fetchPosts = async (userId: string): Promise<ClientPost[]> => {
  const pgPosts = await getPgPostsByUserId(userId);

  return await getClientPosts(pgPosts);
};

interface PgPostWithFiles extends Post {
  files: File[];
}

export const getPgPostsByUserId = async (
  userId: string
): Promise<PgPostWithFiles[]> => {
  const pgPosts = await prisma.post.findMany({
    where: { authorId: userId },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      files: true
    }
  });
  return pgPosts;
};

export const getPgPostByPostId = async (postId: string): Promise<Post> => {
  const pgPost = await prisma.post.findUnique({ where: { id: postId } });
  if (!pgPost) {
    throw Error('[Postgre] User not found!');
  }
  return pgPost;
};

export const getLikedPosts = async (userId: string): Promise<Post[]> => {
  return await prisma.post.findMany({
    where: {
      likedBy: {
        some: {
          userId
        }
      }
    }
  });
};

export const likePost = async (postId: string, userId: string) => {
  const updatedPost = await prisma.post.update({
    where: {
      id: postId
    },
    data: {
      totalLikes: {
        increment: 1
      },
      likedBy: {
        create: {
          userId: userId
        }
      }
    }
  });
  const totalLikes = updatedPost.totalLikes;
  const likedPosts = await getLikedPosts(userId);
  const likedPostsIds = likedPosts.map((post) => post.id);

  return { totalLikes, likedPostsIds };
};

export const unlikePost = async (postId: string, userId: string) => {
  await prisma.like.delete({
    where: {
      postId_userId: {
        postId,
        userId
      }
    }
  });
  const updatedPost = await prisma.post.update({
    where: {
      id: postId
    },
    data: {
      totalLikes: {
        decrement: 1
      }
    }
  });
  const totalLikes = updatedPost.totalLikes;
  const likedPosts = await prisma.post.findMany({
    where: {
      likedBy: {
        some: {
          userId
        }
      }
    }
  });
  const likedPostsIds = likedPosts.map((post) => post.id);

  return { totalLikes, likedPostsIds };
};

export const fetchLikePosts = async (userId: string): Promise<ClientPost[]> => {
  const pgUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { likedPosts: true }
  });
  if (!pgUser?.likedPosts) {
    throw new Error('There is no liked posts.');
  }
  const likedPostArray = [] as PgPostWithFiles[];
  for (const likedPost of pgUser.likedPosts) {
    const post = await prisma.post.findUnique({
      where: { id: likedPost.postId },
      include: { files: true }
    });
    if (post) {
      likedPostArray.push(post);
    }
  }
  return await getClientPosts(likedPostArray);
};

export const getClientPosts = async (
  pgPosts: PgPostWithFiles[]
): Promise<ClientPost[]> => {
  const posts: ClientPost[] = [];
  for (const post of pgPosts) {
    const newFiles: ClientMediaFile[] = [];
    for (const file of post.files) {
      const getPortraitFileParams = {
        Bucket: postBucketName,
        Key: file.portraitFileKey
      };

      const portraitFileUrl = await getFileFromS3(getPortraitFileParams);

      const getSquareFileParams = {
        Bucket: postBucketName,
        Key: file.squareFileKey
      };
      const squareFileUrl = await getFileFromS3(getSquareFileParams);

      newFiles.push({
        id: file.id,
        fileName: file.fileName,
        size: file.size,
        mimetype: file.mimetype,
        alt: file.alt,
        portraitFileKey: file.portraitFileKey,
        squareFileKey: file.squareFileKey,
        portraitFileUrl,
        squareFileUrl
      });
    }

    // Get author
    const pgAuthor = await prisma.user.findUnique({
      where: {
        id: post.authorId
      }
    });
    if (!pgAuthor) {
      throw new Error('author is not found');
    }

    const clientAuthor = await convertPgUserToClientUser(pgAuthor);
    const pgComments = await prisma.comment.findMany({
      where: { postId: post.id },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const clientComments = await convertPgCommentsToClientComments(pgComments);

    posts.push({
      id: post.id,
      caption: post.caption,
      files: newFiles,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: clientAuthor,
      totalLikes: post.totalLikes,
      totalComments: post.totalComments,
      comments: clientComments
    });
  }
  const orderedPosts = posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return orderedPosts;
};

export const getComments = async (postId: string): Promise<Comment[]> => {
  return await prisma.comment.findMany({ where: { postId } });
};

interface CreateCommentParams {
  userId: string;
  postId: string;
  text: string;
}

export const createComment = async (
  createCommentParams: CreateCommentParams
): Promise<ClientPost> => {
  const { userId, postId, text } = createCommentParams;
  await prisma.comment.create({
    data: {
      content: text,
      authorId: userId,
      postId: postId
    }
  });

  await prisma.post.update({
    where: {
      id: postId
    },
    data: {
      totalComments: { increment: 1 }
    }
  });

  const updatedPgPost = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      comments: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      files: true
    }
  });

  if (!updatedPgPost) {
    throw new Error('Failed to update post');
  }

  const result = await getClientPosts([updatedPgPost]);

  return result[0];
};

export const getReplies = async (commentId: string): Promise<Reply[]> => {
  const replies = await prisma.reply.findMany({
    where: { commentId: commentId }
  });
  return replies;
};

export const getPgMediaFiles = async (postId: string): Promise<File[]> => {
  return await prisma.file.findMany({ where: { postId } });
};
