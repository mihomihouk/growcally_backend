import { Request } from 'express';
import { ClientUser } from './user';
export interface AuthRequest extends Request {
  userId?: string;
  user?: ClientUser;
  cookies: any;
}

export interface PostRequest extends Request {
  userId?: string;
  postId?: string;
}
