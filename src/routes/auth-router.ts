import { Router } from 'express';
import {
  resendCode,
  signUpUser,
  verifyUser
} from '../middleware/auth-middleware';

const router = Router();

router.post('/auth/signup', signUpUser);
router.post('/auth/verify', verifyUser);
router.post('/auth/resend-code', resendCode);
// router.post('/auth/login', signInRequest);

export default router;
