import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// User
export const getPgUserById = async (userId: string) => {
  const pgUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!pgUser) {
    throw Error('[Postgre] User not found!');
  }
  return pgUser;
};

export const getPgUserBySub = async (userSub: string) => {
  const pgUser = await prisma.user.findUnique({ where: { sub: userSub } });
  if (!pgUser) {
    throw Error('[Postgre] User not found!');
  }
  return pgUser;
};

export const updatePgUser = async (userId: string, data: any) => {
  await prisma.user.update({
    where: {
      id: userId
    },
    data
  });
};

// Account

export const getPgAccountByUserId = async (userId: string) => {
  const pgAccount = await prisma.account.findUnique({
    where: { ownerId: userId }
  });
  if (!pgAccount) {
    throw Error('[Postgre] account not found!');
  }
  return pgAccount;
};

// Post

export const getPgPostsByUserId = async (userId: string) => {
  const pgPost = await prisma.post.findMany({ where: { authorId: userId } });
  if (!pgPost) {
    throw Error('[Postgre] posts not found!');
  }
  return pgPost;
};

export const getPgPostByPostId = async (postId: string) => {
  const pgPost = await prisma.post.findUnique({ where: { id: postId } });
  if (!pgPost) {
    throw Error('[Postgre] Post not found!');
  }
  return pgPost;
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
