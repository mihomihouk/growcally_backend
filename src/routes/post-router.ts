import { Router } from 'express';
import {
  createNewPost,
  getAllPosts,
  likePostRequest,
  unlikePostRequest,
  upload
} from '../controllers/post-controller';

const router = Router();

router.get('/post/get-posts', getAllPosts);
router.post('/post/upload', upload.array('images', 10), createNewPost);
router.put('/post/like', likePostRequest);
router.put('/post/unlike', unlikePostRequest);

export default router;
