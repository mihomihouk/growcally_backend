import { Router } from 'express';
import {
  fetchUserDetailRequest,
  loginUser,
  logoutUser,
  resendCode,
  signUpUser,
  updateUserProfileRequest,
  verifyUser
} from '../controllers/auth-controller';
import { authGuard } from '../guards/auth-guard';
import { upload } from '../controllers/post-controller';

const router = Router();

router.post('/auth/signup', signUpUser);
router.post('/auth/verify', verifyUser);
router.post('/auth/resend-code', resendCode);
router.post('/auth/login', loginUser);
router.post('/auth/logout', authGuard, logoutUser);
router.get('/auth/:userId', authGuard, fetchUserDetailRequest);
router.put(
  '/auth/profile',
  authGuard,
  upload.single('image'),
  updateUserProfileRequest
);

export default router;
