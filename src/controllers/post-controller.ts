import { RequestHandler } from 'express';
import { HttpStatusCodes } from '../enum/http-codes';
import multer from 'multer';
import { PostRequest } from '../interfaces/request';
import {
  createComment,
  createPost,
  deletePost,
  getAllPosts,
  getPgPostByPostId,
  likePost,
  unlikePost
} from '../services/postgreSql/postgreSql-service';

const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export const getAllPostsRequest: RequestHandler = async (req, res) => {
  try {
    const posts = await getAllPosts();

    res.status(HttpStatusCodes.OK).json(posts);
  } catch (error) {
    console.error('[Post] Get Posts', error);
    res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ message: "Oops! We've failed to get some information." });
  }
};

export const createNewPost: RequestHandler = async (req, res) => {
  try {
    await createPost(req);
    return res
      .status(HttpStatusCodes.CREATED)
      .json({ message: 'Post successfully created' });
  } catch (error) {
    console.error('[Post] Create New Post Error', error);
    return res
      .status(HttpStatusCodes.INTERNAL_ERROR)
      .json({ message: 'Oops! Something went wrong while creating the post.' });
  }
};

export const deletePostRequest: RequestHandler = async (req, res) => {
  try {
    const userId = req.query.userId?.toString();
    const postId = req.params.postId;

    if (!userId || !postId) {
      throw new Error(
        'Invalid deletePostParams. userId and postId are required.'
      );
    }

    const { updatedPosts, updatedUser } = await deletePost(postId, userId);
    return res.status(HttpStatusCodes.CREATED).json({
      message: 'Post deleted successfully',
      updatedPosts,
      updatedUser
    });
  } catch (error) {
    console.error('[Post] Delete New Post Error', error);
    return res
      .status(HttpStatusCodes.INTERNAL_ERROR)
      .json({ message: 'Oops! Something went wrong while deleting the post.' });
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
      throw new Error(
        'Invalid deletePostParams. userId and postId are required.'
      );
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
    return res
      .status(HttpStatusCodes.INTERNAL_ERROR)
      .json({ message: 'Oops! Something went wrong.' });
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
      throw new Error(
        'Invalid deletePostParams. userId and postId are required.'
      );
    }
    const { totalLikes, likedPostsIds } = await unlikePost(postId, userId);

    return res.status(HttpStatusCodes.OK).json({
      message: "You've unliked post successfully",
      totalLikes,
      likedPostsIds
    });
  } catch (error) {
    console.log('[Post] Unlike Post Error', error);
    return res
      .status(HttpStatusCodes.INTERNAL_ERROR)
      .json({ message: 'Oops! Something went wrong.' });
  }
};

// Comment

export const createNewComment: RequestHandler = async (req, res) => {
  try {
    const userId = req.query.userId?.toString();
    const { postId, text } = req.body;

    if (!userId || !postId) {
      throw new Error(
        'Invalid deletePostParams. userId and postId are required.'
      );
    }

    // Store data on DB
    const updatedPost = await createComment({ userId, postId, text });
    return res
      .status(HttpStatusCodes.CREATED)
      .json({ message: 'Comment successfully created', updatedPost });
  } catch (error) {
    console.error('[Comment] Create New Comment Error', error);
    return res.status(HttpStatusCodes.INTERNAL_ERROR).json({
      message: 'Oops! Something went wrong while creating the comment.'
    });
  }
};
