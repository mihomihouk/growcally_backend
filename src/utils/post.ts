import { Comment, Post, Reply } from '@prisma/client';
import {
  getComments,
  getPgMediaFiles,
  getPgUserById,
  getReplies
} from '../services/postgreSql/postgreSql-service';
import { convertPgUserToClientUser } from './user';
import { ClientComment, ClientReply } from '../interfaces/post';

export const convertPgPostToClientPost = async (pgPost: Post) => {
  const pgAuthor = await getPgUserById(pgPost.authorId);
  const author = await convertPgUserToClientUser(pgAuthor);
  const files = await getPgMediaFiles(pgPost.id);
  const pgComments = await getComments(pgPost.id);
  const comments = await convertPgCommentsToClientComments(pgComments);

  const clientPost = {
    caption: pgPost?.caption,
    createdAt: pgPost?.createdAt,
    updatedAt: pgPost?.updatedAt,
    totalLikes: pgPost.totalLikes,
    totalComments: pgPost.totalComments,
    id: pgPost.id,
    author,
    files,
    comments
  };
  return clientPost;
};

export const convertPgCommentsToClientComments = async (
  pgComments: Comment[]
): Promise<ClientComment[]> => {
  let clientComments = [] as ClientComment[];
  for (const pgComment of pgComments) {
    const clientComment = await convertPgCommentToClientComment(pgComment);
    clientComments.push(clientComment);
  }
  return clientComments;
};

export const convertPgCommentToClientComment = async (
  pgComment: Comment
): Promise<ClientComment> => {
  const pgAuthor = await getPgUserById(pgComment.authorId);
  const author = await convertPgUserToClientUser(pgAuthor);
  const pgReplies = await getReplies(pgComment.id);
  const replies = [] as ClientReply[];

  for (const pgReply of pgReplies) {
    const reply = await convertPgReplyToClientReply(pgReply);
    replies.push(reply);
  }
  const clientComment = {
    id: pgComment.id,
    content: pgComment.content,
    updatedAt: pgComment.updatedAt.toISOString(),
    author,
    replies
  };

  return clientComment;
};

export const convertPgReplyToClientReply = async (
  pgReply: Reply
): Promise<ClientReply> => {
  const pgAuthor = await getPgUserById(pgReply.authorId);
  const author = await convertPgUserToClientUser(pgAuthor);

  const clientReply = {
    id: pgReply.id,
    content: pgReply.content,
    createdAt: pgReply.createdAt.toISOString(),
    updatedAt: pgReply.updatedAt.toISOString(),
    author,
    commentId: pgReply.commentId
  };

  return clientReply;
};
