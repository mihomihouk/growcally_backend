import { Router } from 'express';
import {
  loginUser,
  resendCode,
  signUpUser,
  verifyUser
} from '../middleware/auth-middleware';

const router = Router();

router.post('/auth/signup', signUpUser);
router.post('/auth/verify', verifyUser);
router.post('/auth/resend-code', resendCode);
router.post('/auth/login', loginUser);

export default router;
