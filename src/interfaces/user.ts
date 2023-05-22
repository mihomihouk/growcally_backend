import { Account } from '@prisma/client';
import { ClientComment } from './post';

export interface ClientUser {
  id: string;
  status: string;
  givenName: string;
  familyName: string;
  email: string;
  sub: string;
  posts?: string[];
  likedPosts?: string[];
  account: Account;
  comments?: ClientComment[];
}
