import { v4 } from 'uuid';
import {
  cleanFilename,
  safeDecodeURIComponent,
  trimFilename
} from '../utils/text';
import { GetPostsRequest, UploadNewPostRequest } from '../interfaces/request';
import { RequestHandler } from 'express';
import { HttpStatusCodes } from '../enum/http-codes';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { s3Get } from '../services/s3/s3-service';
import { PrismaClient } from '@prisma/client';
import { MediaFile, Post } from '../interfaces/post';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import sharp from 'sharp';

const randomBytes = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

dotenv.config();

const fs = require('fs');
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

export const getAllPosts: RequestHandler = async (
  req: GetPostsRequest,
  res,
  next
) => {
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

      posts.push({
        id: post.id,
        caption: post.caption,
        files: newFiles,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author,
        likes: post.likes,
        totalComments: post.totalComments
      });
    }

    res.status(HttpStatusCodes.OK).json(posts);
  } catch (error) {
    console.error('[Post] Get Posts', error);
    next(error);
  }
};

export const createNewPost: RequestHandler = async (
  req: UploadNewPostRequest,
  res,
  next
) => {
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
      const altPropertyName = 'fileAltText' + file.originalname;
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

    const post = await prisma.post.create({
      data: {
        author: 'miho',
        caption: req.body.caption,
        files: {
          create: newFiles
        }
      }
    });

    res.status(HttpStatusCodes.CREATED).json({});
  } catch (error) {
    console.error('[Post] Create New Post', error);
    next(error);
  }
};
