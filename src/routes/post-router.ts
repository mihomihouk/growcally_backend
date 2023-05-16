import { Router } from 'express';
import {
  createNewPost,
  getAllPosts,
  upload
} from '../controllers/post-controller';

const router = Router();

router.get('/post/get-posts', getAllPosts);
router.post('/post/upload', upload.array('images', 10), createNewPost);

export default router;
