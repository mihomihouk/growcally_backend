import {
  cleanFilename,
  safeDecodeURIComponent,
  trimFilename
} from '../utils/text';
import { RequestHandler } from 'express';
import { HttpStatusCodes } from '../enum/http-codes';
import crypto from 'crypto';
import { s3Get } from '../services/s3/s3-service';
import { PrismaClient } from '@prisma/client';
import { MediaFile, Post } from '../interfaces/post';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import sharp from 'sharp';
import { convertPgUserToUser } from '../utils/user';
import { PostRequest } from '../interfaces/request';
import {
  getPgPostByPostId,
  likePost,
  unlikePost
} from '../services/postgreSql/postgreSql-service';

const randomBytes = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const prisma = new PrismaClient();

const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

const bucketName = process.env.BUCKET_NAME!;

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export const getAllPosts: RequestHandler = async (req, res, next) => {
  try {
    const postsFromPrisma = await prisma.post.findMany({
      orderBy: [{ createdAt: 'desc' }],
      include: {
        files: true
      }
    });

    const posts: Post[] = [];
    for (const post of postsFromPrisma) {
      const newFiles: MediaFile[] = [];
      for (const file of post.files) {
        const getObjectParams = {
          Bucket: bucketName,
          Key: file.fileKey
        };
        const command = new GetObjectCommand(getObjectParams);
        const fileUrl = await getSignedUrl(s3Get, command, { expiresIn: 3600 });
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
        return res
          .status(HttpStatusCodes.INTERNAL_ERROR)
          .json({ message: 'Sorry! There has been an internal error.' });
      }

      const author = await convertPgUserToUser(pgAuthor);

      posts.push({
        id: post.id,
        caption: post.caption,
        files: newFiles,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: author,
        totalLikes: post.totalLikes,
        totalComments: post.totalComments
      });
    }

    res.status(HttpStatusCodes.OK).json(posts);
  } catch (error) {
    console.error('[Post] Get Posts', error);
    res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ message: "Oops! We've failed to get some information." });
  }
};

export const createNewPost: RequestHandler = async (req, res, next) => {
  try {
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
      await s3Get.send(command);

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

    return res
      .status(HttpStatusCodes.CREATED)
      .json({ message: 'Post successfully created' });
  } catch (error) {
    console.error('[Post] Create New Post Error', error);
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: error });
  }
};

export const likePostRequest: RequestHandler = async (
  req: PostRequest,
  res
) => {
  try {
    const userId = req.query.userId?.toString();
    const { postId } = req.body;
    const pgPost = await getPgPostByPostId(postId);
    if (!userId || !postId) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message:
          "Oops! We couldn't process your request because some required information is missing."
      });
    }

    // TODO: Uncomment these lines below before release
    // if (pgPost.authorId === userId) {
    //   return res.status(HttpStatusCodes.BAD_REQUEST).json({
    //     message: 'You are only able to like posts that belong to other users'
    //   });
    // }

    const { totalLikes, likedPostsIds } = await likePost(postId, userId);

    return res
      .status(HttpStatusCodes.OK)
      .json({ message: 'Post liked successfully', likedPostsIds, totalLikes });
  } catch (error) {
    console.log('[Post] Like Post Error', error);
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: error });
  }
};

export const unlikePostRequest: RequestHandler = async (
  req: PostRequest,
  res
) => {
  try {
    const userId = req.query.userId?.toString();
    const { postId } = req.body;
    if (!userId || !postId) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message:
          "Oops! We couldn't process your request because some required information is missing."
      });
    }
    const { totalLikes, likedPostsIds } = await unlikePost(postId, userId);

    return res.status(HttpStatusCodes.OK).json({
      message: "You've unliked post successfully",
      totalLikes,
      likedPostsIds
    });
  } catch (error) {
    console.log(error);
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: error });
  }
};
