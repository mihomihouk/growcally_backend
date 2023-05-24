import { User } from '@prisma/client';
import {
  getLikedPosts,
  getPgAccountByUserId,
  getPgPostsByUserId,
  getPgProfileImage
} from '../services/postgreSql/postgreSql-service';
import { ClientUser } from '../interfaces/user';
import { getFileFromS3 } from '../services/s3/s3-service';

const profileImageBucketName = process.env.PROFILE_IMAGE_BUCKET_NAME!;

export const convertPgUserToClientUser = async (
  pgUser: User
): Promise<ClientUser> => {
  //Insert account and likedPost in user to return full user
  let profileImage;
  const pgProfileImage = await getPgProfileImage(pgUser.id);
  if (pgProfileImage) {
    const getObjectParams = {
      Bucket: profileImageBucketName,
      Key: pgProfileImage.fileKey
    };
    const profileImageFileUrl = await getFileFromS3(getObjectParams);
    profileImage = {
      ...pgProfileImage,
      fileUrl: profileImageFileUrl
    };
  }

  const account = await getPgAccountByUserId(pgUser.id);
  const posts = await getPgPostsByUserId(pgUser.id);
  const postsIds = posts.map((post) => post.id);
  const likedPosts = await getLikedPosts(pgUser.id);
  const likedPostsIds = likedPosts.map((post) => post.id);

  const user = {
    id: pgUser.id,
    status: pgUser.status,
    givenName: pgUser.givenName,
    familyName: pgUser.familyName,
    email: pgUser.email,
    bio: pgUser.bio ?? undefined,
    profileImage: profileImage ?? undefined,
    sub: pgUser.sub!,
    posts: postsIds,
    likedPosts: likedPostsIds,
    account
  };
  return user;
};
