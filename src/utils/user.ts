import { User } from '@prisma/client';
import {
  getLikedPosts,
  getPgAccountByUserId,
  getPgPostsByUserId
} from '../services/postgreSql/postgreSql-service';
import { FullUser } from '../interfaces/user';

export const convertPgUserToUser = async (pgUser: User): Promise<FullUser> => {
  //Insert account and likedPost in user to return full user
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
    sub: pgUser.sub!,
    posts: postsIds,
    likedPosts: likedPostsIds,
    account
  };
  return user;
};
