import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";
dotenv.config();
const bucketRegion = process.env.BUCKET_REGION!;
const bucketAccessKey = process.env.BUCKET_ACCESS_KEY!;
const bucketSecretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY!;

export const s3Get = new S3Client({
  credentials: {
    accessKeyId: bucketAccessKey,
    secretAccessKey: bucketSecretAccessKey,
  },
  region: bucketRegion,
});
