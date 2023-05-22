import { Router } from 'express';
import {
  createNewComment,
  createNewPost,
  deletePostRequest,
  getAllPostsRequest,
  likePostRequest,
  unlikePostRequest,
  upload
} from '../controllers/post-controller';

const router = Router();

router.get('/post/get-posts', getAllPostsRequest);
router.post('/post/upload', upload.array('images', 10), createNewPost);
router.delete('/post/:postId', deletePostRequest);
router.put('/post/like', likePostRequest);
router.put('/post/unlike', unlikePostRequest);
router.post('/post/comment', createNewComment);

export default router;
