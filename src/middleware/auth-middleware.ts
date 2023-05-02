import { RequestHandler } from 'express';
import { registerToCognito } from '../services/cognito/cognito-services';

export const signUpUser: RequestHandler = async (req, res, next) => {
  const {
    firstName: givenName,
    surname: familyName,
    email,
    password,
    token
  } = req.body;

  const name = `${givenName} ${familyName}`;

  //Cognito
  try {
    const registeredUser = await registerToCognito({
      name,
      email: email.toLowerCase(),
      givenName,
      familyName,
      password
    });
    console.log('registeredUser:::', registeredUser);
  } catch (error) {
    console.log('[Auth] SignUp Error', error);
    return next(error);
  }

  //Create User on DB
};
