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
    const userId = req.query.userId?.toString() ?? req.body.userId;

    if (!accessToken || !userId) {
      console.log('[Auth] No access token or user id');
      return res
        .status(HttpStatusCodes.UNAUTHORISED)
        .json({
          message: 'Unauthorised: Your access token or user id is missing.'
        });
    }

    if (checkTokenExpired(accessToken)) {
      const pgUser = await getPgUserById(userId);
      if (!pgUser.refreshToken) {
        console.log('[Auth] No refresh token');
        return res
          .status(HttpStatusCodes.INTERNAL_ERROR)
          .json({ message: "We've failed to confirm your user information" });
      }
      const result = await refreshTokenWithCognito(pgUser.refreshToken);
      if (!result?.AuthenticationResult) {
        console.log('[Auth] Failed to retrieve refresh token from Cognito');
        return res
          .status(HttpStatusCodes.INTERNAL_ERROR)
          .json({ message: "We've failed to renew your refresh token" });
      }
      const { AccessToken, RefreshToken, ExpiresIn } =
        result.AuthenticationResult;

      if (!AccessToken || !RefreshToken || !ExpiresIn) {
        console.log('[Auth] AuthenticationResult is insufficient');
        return res
          .status(HttpStatusCodes.INTERNAL_ERROR)
          .json({ message: "We've failed to renew your refresh token" });
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
      console.log('[Auth] Failed to validate jwt token');
      return res
        .status(HttpStatusCodes.UNAUTHORISED)
        .json({ message: 'Unauthorised: Your token is invalid.' });
    }
    next();
  } catch (error: any) {
    console.error('JWT token is invalid:', error);
    return res
      .status(HttpStatusCodes.UNAUTHORISED)
      .json({ message: error.message });
  }
};
