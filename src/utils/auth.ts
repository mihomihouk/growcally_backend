import jwt from 'jsonwebtoken';

export const checkTokenExpired = (token: string): boolean => {
  const decode = jwt.decode(token) as jwt.JwtPayload;

  if (!decode || !decode.exp) {
    return false;
  }
  const currentTimestamp = Math.floor(new Date().getTime() / 1000);
  const expTimestamp = decode.exp;

  return currentTimestamp > expTimestamp;
};
