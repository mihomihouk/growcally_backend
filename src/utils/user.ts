import { User } from '@prisma/client';

export const convertPrismaUserToUser = (prismaAuthor: User) => {
  const user = {
    id: prismaAuthor.id,
    status: prismaAuthor.status,
    givenName: prismaAuthor.givenName,
    familyName: prismaAuthor.familyName,
    email: prismaAuthor.email,
    sub: prismaAuthor.sub!
  };
  return user;
};
