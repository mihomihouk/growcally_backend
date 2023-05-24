import { Account } from '@prisma/client';
import { ClientComment } from './post';

export interface ClientUser {
  id: string;
  status: string;
  givenName: string;
  familyName: string;
  email: string;
  bio?: string;
  profileImage?: ClientProfileImageFile;
  sub: string;
  posts?: string[];
  likedPosts?: string[];
  account: Account;
  comments?: ClientComment[];
}

export interface ClientProfileImageFile {
  id?: string;
  fileName: string;
  size: number;
  mimeType: string;
  fileKey: string;
  fileUrl?: string;
}
