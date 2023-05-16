import { Router } from 'express';
import authRouter from './auth-router';
import postRouter from './post-router';
import { authGuard } from '../guards/auth-guard';

const router = Router();
router.use(authRouter);
// This order is important. We apply authGuard to only some requests.
router.use(authGuard);
router.use(postRouter);

export default router;
