import { RequestHandler } from 'express';
import {
  confirmSignUpWithCognito,
  loginUserWithCognito,
  registerToCognito,
  resendConfirmationCode
} from '../services/cognito/cognito-service';
import { HttpStatusCodes } from '../enum/http-codes';
import { PrismaClient } from '@prisma/client';
import { updatePgUser } from '../services/postgreSql/postgreSql-service';

const prisma = new PrismaClient();

export const signUpUser: RequestHandler = async (req, res, next) => {
  const {
    firstName: givenName,
    surname: familyName,
    email,
    password
  } = req.body;

  const name = `${givenName} ${familyName}`;

  try {
    //Check if the user already exists
    const user = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (user) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: 'You are already registered. Please login via login page.'
      });
    }

    // Cognito
    const registeredUser = await registerToCognito({
      name,
      email: email.toLowerCase(),
      givenName,
      familyName,
      password
    });

    if (!registeredUser) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: 'Signup failed. Please try again.'
      });
    }
    const userSub = registeredUser.UserSub!;

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
      message: 'User successfully created'
    });
  } catch (error) {
    console.log('[Auth] SignUp Error', error);
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: error });
  }
};

export const verifyUser: RequestHandler = async (req, res, next) => {
  const { email, verificationCode } = req.body;

  try {
    // Check if user already exists
    const updatedUser = await prisma.user.findUnique({
      where: {
        email
      }
    });
    if (!updatedUser) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: 'You are not yet registered. Please sign up first.'
      });
    }
    if (updatedUser && updatedUser.status === 'CONFIRMED') {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ message: 'User already confirmed' });
    }
    await confirmSignUpWithCognito({ email, verificationCode });
    await updatePgUser(updatedUser?.id, { status: 'CONFIRMED' });
    return res
      .status(HttpStatusCodes.OK)
      .json({ message: 'Email successfully verified' });
  } catch (error) {
    console.log('[Auth] Verification Error', error);
    let errorMessage;
    switch (error) {
      case 'User already confirmed':
        errorMessage =
          'Your email is already confirmed. Please log in via login page.';
        break;
      case 'Error: User email is not found':
        errorMessage = 'Your email is not found. Please provide correct email.';
        break;
      default:
        errorMessage = 'Code you provided is invalid. Please try again.';
        break;
    }
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ message: errorMessage });
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

export const loginUser: RequestHandler = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    //Check if the user already exists
    const user = await prisma.user.findUnique({
      where: {
        email
      }
    });
    if (!user) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: 'You are not yet registered. Please sign up first.'
      });
    }
    if (user && user.status === 'UNCONFIRMED') {
      await resendConfirmationCode(email);
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: 'We sent you a verification code. Please verify your email.'
      });
    }
    // Call AWS
    const loginUserParams = {
      email,
      password
    };
    const result = await loginUserWithCognito(loginUserParams);
    const accessToken = result.AuthenticationResult?.AccessToken;
    const refreshToken = result.AuthenticationResult?.RefreshToken;
    const accessTokenExpiry = result.AuthenticationResult?.ExpiresIn;
    if (!accessToken || !refreshToken || !accessTokenExpiry) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message:
          'Failed to initiate authentication. Please provide correct email and password.'
      });
    }

    // Store fresh token in DB
    await updatePgUser(user.id, { refreshToken });

    // Set cookie
    res.cookie('access_token', accessToken, {
      secure: true,
      httpOnly: true,
      maxAge: 86400000
    });

    res.status(HttpStatusCodes.OK).json({
      user
    });
  } catch (error) {
    console.log('[Auth] Login Error', error);
    const errorMessage =
      'Login failed. Please check your username and password.';
    return res
      .status(HttpStatusCodes.UNAUTHORISED)
      .json({ message: errorMessage });
  }
};
