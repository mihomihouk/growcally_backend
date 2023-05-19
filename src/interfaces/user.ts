import { Account } from '@prisma/client';

export interface FullUser {
  id: string;
  status: string;
  givenName: string;
  familyName: string;
  email: string;
  sub: string;
  posts?: string[];
  likedPosts?: string[];
  account: Account;
}
