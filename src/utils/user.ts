import { User } from '@prisma/client';

export const convertPgUserToUser = (pgUser: User) => {
  const user = {
    id: pgUser.id,
    status: pgUser.status,
    givenName: pgUser.givenName,
    familyName: pgUser.familyName,
    email: pgUser.email,
    sub: pgUser.sub!
  };
  return user;
};
