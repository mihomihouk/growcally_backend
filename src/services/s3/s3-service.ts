import { S3Client } from '@aws-sdk/client-s3';
import config from '../../../config';

export const s3 = new S3Client({
  credentials: {
    accessKeyId: config.bucketAccessKey,
    secretAccessKey: config.bucketSecretAccessKey
  },
  region: config.awsRegion
});
