import { HttpStatusCodes } from '../enum/http-codes';
import { AuthRequest } from '../interfaces/request';
import { RequestHandler } from 'express';
import {
  refreshTokenWithCognito,
  validateJwtToken
} from '../services/cognito/cognito-service';
import { checkTokenExpired } from '../utils/auth';
import {
  getPgUserById,
  updatePgUser
} from '../services/postgreSql/postgreSql-service';

export const authGuard: RequestHandler = async (
  req: AuthRequest,
  res,
  next
) => {
  try {
    let accessToken = req.cookies.access_token as string | undefined;
    const userId = req.query.userId?.toString();
    console.log('accessToken', accessToken);

    if (!accessToken || !userId) {
      return res
        .status(HttpStatusCodes.UNAUTHORISED)
        .json({ message: 'Unauthorised' });
    }

    if (checkTokenExpired(accessToken)) {
      const pgUser = await getPgUserById(userId);
      if (!pgUser.refreshToken) {
        return res
          .status(HttpStatusCodes.UNAUTHORISED)
          .json({ message: 'Unauthorised' });
      }
      const result = await refreshTokenWithCognito(pgUser.refreshToken);
      if (!result?.AuthenticationResult) {
        return res
          .status(HttpStatusCodes.UNAUTHORISED)
          .json({ message: 'Unauthorised' });
      }
      const { AccessToken, RefreshToken, ExpiresIn } =
        result.AuthenticationResult;

      if (!AccessToken || !RefreshToken || !ExpiresIn) {
        return res
          .status(HttpStatusCodes.UNAUTHORISED)
          .json({ message: 'Unauthorised' });
      }

      await updatePgUser(userId, { refreshToken: RefreshToken });
      accessToken = AccessToken;
      res.cookie('access_token', accessToken, {
        // secure: true,
        httpOnly: true,
        maxAge: 86400000
      });
    }

    const result = await validateJwtToken(accessToken);
    if (!result) {
      return res
        .status(HttpStatusCodes.UNAUTHORISED)
        .json({ message: 'Unauthorised' });
    }
    next();
  } catch (error: any) {
    console.error('JWT token is invalid:', error);
    return res
      .status(HttpStatusCodes.UNAUTHORISED)
      .json({ message: error.message });
  }
};
