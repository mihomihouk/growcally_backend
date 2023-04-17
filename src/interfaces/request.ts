import { Request } from "express";
import { MediaFile, Post, UploadPost } from "./post";

export interface GetPostsRequest extends Request {}

export interface GetUploadUrlRequest extends Request {}

export interface UploadNewPostRequest extends Request {
  // postId?: string;
  // caption?: string;
  // mediaFiles?: MediaFile[];
  post?: UploadPost;
}
