import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import config from '../../../config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const s3 = new S3Client({
  credentials: {
    accessKeyId: config.bucketAccessKey,
    secretAccessKey: config.bucketSecretAccessKey
  },
  region: config.awsRegion
});

interface UploadFileToS3Params {
  Bucket: string;
  Key: string;
  Body: Buffer;
  ContentType: string;
}

export const uploadFileToS3 = async (
  uploadFileToS3Params: UploadFileToS3Params
) => {
  console.log('uploadFileToS3Params:::', uploadFileToS3Params);
  const command = new PutObjectCommand(uploadFileToS3Params);
  await s3.send(command);
};

interface DeleteFileFromS3Params {
  Bucket: string;
  Key: string | undefined;
}

export const deleteFileFromS3 = async (
  deleteFileFromS3Params: DeleteFileFromS3Params
) => {
  const command = new DeleteObjectCommand(deleteFileFromS3Params);
  await s3.send(command);
};

interface GetFileFromS3Params {
  Bucket: string;
  Key: string;
}

export const getFileFromS3 = async (
  getFileFromS3Params: GetFileFromS3Params
) => {
  const command = new GetObjectCommand(getFileFromS3Params);
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
};
