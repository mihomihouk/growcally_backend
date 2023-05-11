import { Account, Post } from '@prisma/client';

export interface User {
  id: string;
  status: string;
  givenName: string;
  familyName: string;
  email: string;
  sub: string;
  posts: Post[];
  account: Account;
}
