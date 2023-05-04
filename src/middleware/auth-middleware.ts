import { RequestHandler } from 'express';
import {
  confirmSignUpWithCognito,
  registerToCognito,
  resendConfirmationCode
} from '../services/cognito/cognito-services';
import { HttpStatusCodes } from '../enum/http-codes';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const signUpUser: RequestHandler = async (req, res, next) => {
  const {
    firstName: givenName,
    surname: familyName,
    email,
    password,
    token
  } = req.body;

  const name = `${givenName} ${familyName}`;

  try {
    // Cognito
    const registeredUser = await registerToCognito({
      name,
      email: email.toLowerCase(),
      givenName,
      familyName,
      password
    });

    const userSub = registeredUser.UserSub;

    // Create a new user on DB
    const createdUser = await prisma.user.create({
      data: {
        status: 'UNCONFIRMED',
        givenName,
        familyName,
        email,
        sub: userSub
      }
    });

    // Create an account on DB
    await prisma.account.create({
      data: {
        ownerId: createdUser.id
      }
    });

    return res.status(HttpStatusCodes.CREATED).json({
      data: createdUser.id,
      message: 'User successfully created'
    });
  } catch (error) {
    console.log('[Auth] SignUp Error', error);
    return next(error);
  }
};

export const verifyUser: RequestHandler = async (req, res, next) => {
  const { email, verificationCode } = req.body;

  try {
    const updatedUser = await prisma.user.findUnique({
      where: {
        email
      }
    });
    if (updatedUser?.sub) {
      const userSub = updatedUser.sub;
      await confirmSignUpWithCognito({ userSub, verificationCode });
      return res
        .status(HttpStatusCodes.OK)
        .json({ message: 'Email successfully verified' });
    }
  } catch (error) {
    console.log('[Auth] Verification Error', error);
    return next(error);
  }
};

export const resendCode: RequestHandler = async (req, res, next) => {
  const { email } = req.body;
  try {
    await resendConfirmationCode(email);
    res
      .status(HttpStatusCodes.OK)
      .json({ message: 'Verification code successfully sent' });
  } catch (error) {
    console.log('[Auth] Resend Code Error', error);
    return next(error);
  }
};
