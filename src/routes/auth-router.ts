import { Router } from 'express';
import {
  fetchUserDetailRequest,
  loginUser,
  logoutUser,
  resendCode,
  signUpUser,
  verifyUser
} from '../controllers/auth-controller';
import { authGuard } from '../guards/auth-guard';

const router = Router();

router.post('/auth/signup', signUpUser);
router.post('/auth/verify', verifyUser);
router.post('/auth/resend-code', resendCode);
router.post('/auth/login', loginUser);
router.post('/auth/logout', authGuard, logoutUser);
router.get('/auth/:userId', authGuard, fetchUserDetailRequest);

export default router;
