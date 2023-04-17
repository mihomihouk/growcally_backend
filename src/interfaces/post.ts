export interface UploadPost {
  caption: string;
  files: UploadFile[];
}

export interface UploadFile {
  id: string;
  file: File;
  altText?: string;
}

export interface Post {
  id: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  files: MediaFile[];
  likes: number;
  caption: string;
  totalComments: number;
}
export interface MediaFile {
  id?: string;
  fileName: string;
  size: number;
  mimetype: string;
  alt: string | null;
  fileKey: string;
  fileUrl?: string;
}
