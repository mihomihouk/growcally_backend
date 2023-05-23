import {
  Account,
  Comment,
  File,
  Post,
  PrismaClient,
  Reply,
  User
} from '@prisma/client';
import { ClientUser } from '../../interfaces/user';
import { convertPgUserToClientUser } from '../../utils/user';
import {
  convertPgCommentsToClientComments,
  convertPgPostToClientPost
} from '../../utils/post';
import { ClientPost, MediaFile } from '../../interfaces/post';
import { s3 } from '../s3/s3-service';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MulterFile } from '../../controllers/post-controller';
import crypto from 'crypto';
import sharp from 'sharp';
import {
  cleanFilename,
  safeDecodeURIComponent,
  trimFilename
} from '../../utils/text';
import { Request } from 'express';

const bucketName = process.env.BUCKET_NAME!;

const prisma = new PrismaClient();
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

  const posts: ClientPost[] = [];
  for (const post of postsFromPrisma) {
    const newFiles: MediaFile[] = [];
    for (const file of post.files) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: file.fileKey
      };
      const command = new GetObjectCommand(getObjectParams);
      const fileUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      newFiles.push({
        id: file.id,
        fileName: file.fileName,
        size: file.size,
        mimetype: file.mimetype,
        alt: file.alt,
        fileKey: file.fileKey,
        fileUrl
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
      where: { postId: post.id }
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
  return posts;
};

export const createPost = async (req: Request): Promise<void> => {
  const files = req.files as MulterFile[];

  const newFiles: MediaFile[] = [];
  // Upload files to S3
  for (const file of files) {
    const s3FileKey = randomBytes();
    const resizedFile = await sharp(file.buffer)
      .resize({ height: 1920, width: 1080, fit: 'contain' })
      .toBuffer();

    const params = {
      Bucket: bucketName,
      Key: s3FileKey,
      Body: resizedFile,
      ContentType: file.mimetype
    };
    const command = new PutObjectCommand(params);
    await s3.send(command);

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
      fileKey: s3FileKey
    });
  }

  // Store data on DB

  await prisma.post.create({
    data: {
      authorId: req.body.authorId,
      caption: req.body.caption,
      files: {
        create: newFiles
      }
    }
  });
};

export const deletePost = async (postId: string, userId: string) => {
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

  const posts: ClientPost[] = [];
  for (const post of pgPosts) {
    const newFiles: MediaFile[] = [];
    for (const file of post.files) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: file.fileKey
      };
      const command = new GetObjectCommand(getObjectParams);
      const fileUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      newFiles.push({
        id: file.id,
        fileName: file.fileName,
        size: file.size,
        mimetype: file.mimetype,
        alt: file.alt,
        fileKey: file.fileKey,
        fileUrl
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
      where: { postId: post.id }
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
  return posts;
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
    include: { comments: true, files: true }
  });

  if (!updatedPgPost) {
    throw new Error('Failed to update post');
  }

  const clientPost = await convertPgPostToClientPost(updatedPgPost);

  return clientPost;
};

export const getReplies = async (commentId: string): Promise<Reply[]> => {
  const replies = await prisma.reply.findMany({
    where: { commentId: commentId }
  });
  return replies;
};

export const getMediaFiles = async (postId: string): Promise<File[]> => {
  return await prisma.file.findMany({ where: { postId } });
};
