import { Router } from 'express';
import authRouter from './auth-router';
import postRouter from './post-router';

const router = Router();
router.use(authRouter);
router.use(postRouter);

export default router;
