import { Request } from 'express';
import { User } from './user';
export interface AuthRequest extends Request {
  userId?: string;
  user?: User;
  cookies: any;
}

export interface PostRequest extends Request {
  userId?: string;
  postId?: string;
}
