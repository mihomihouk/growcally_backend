import { Router } from 'express';
import { signUpUser } from '../middleware/auth-middleware';

const router = Router();

router.post('/auth/signup', signUpUser);
// router.post('/auth/login', signInRequest);

export default router;
