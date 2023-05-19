import { PrismaClient } from '@prisma/client';
import { FullUser } from '../../interfaces/user';
import { convertPgUserToUser } from '../../utils/user';

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

export const updatePgUser = async (
  userId: string,
  data: any
): Promise<FullUser> => {
  const updatedUser = await prisma.user.update({
    where: {
      id: userId
    },
    data
  });

  const updatedPgUser = convertPgUserToUser(updatedUser);
  return updatedPgUser;
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

export const getLikedPosts = async (userId: string) => {
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
