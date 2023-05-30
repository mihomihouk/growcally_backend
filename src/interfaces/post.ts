import { ClientUser } from './user';

export interface UploadPost {
  caption: string;
  files: UploadFile[];
}

export interface UploadFile {
  id: string;
  file: File;
  altText?: string;
}

export interface ClientPost {
  id: string;
  author: ClientUser;
  createdAt: Date;
  updatedAt: Date;
  files: ClientMediaFile[];
  caption: string;
  totalLikes: number;
  totalComments: number;
  comments: ClientComment[];
}
export interface ClientMediaFile {
  id?: string;
  fileName: string;
  size: number;
  mimetype: string;
  alt: string | null;
  fileKey?: string;
  portraitFileKey: string;
  squareFileKey: string;
  portraitFileUrl?: string;
  squareFileUrl?: string;
}

export interface ClientComment {
  id: string;
  content: string;
  updatedAt: string;
  author: ClientUser;
  replies?: ClientReply[];
}
export interface ClientReply {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: ClientUser;
  commentId: string;
}
