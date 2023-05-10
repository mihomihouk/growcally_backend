import {
  SignUpCommand,
  InitiateAuthCommand,
  CognitoIdentityProviderClient,
  SignUpCommandOutput,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  AdminGetUserCommand,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider';
import config from '../../../config';
import {
  LoginUserParams,
  UserParams,
  VerifyUserParams
} from '../../interfaces/auth';

export enum CognitoAttributes {
  Name = 'name',
  GivenName = 'given_name',
  FamilyName = 'family_name',
  Email = 'email',
  EmailVerified = 'email_verified'
}

const cognitoService = new CognitoIdentityProviderClient({
  region: config.awsRegion
});

const clientId = config.awsCognitoClientId!;
const userPoolId = config.awsCognitoPoolId!;

export const registerToCognito = async (
  userParams: UserParams
): Promise<SignUpCommandOutput> => {
  const { name, givenName, familyName, email, password } = userParams;
  const userAttributes = [
    {
      Name: CognitoAttributes.Name,
      Value: name
    }
  ];

  userAttributes.push({
    Name: CognitoAttributes.Email,
    Value: email
  });

  userAttributes.push({
    Name: CognitoAttributes.GivenName,
    Value: givenName
  });

  userAttributes.push({
    Name: CognitoAttributes.FamilyName,
    Value: familyName
  });

  const command = new SignUpCommand({
    ClientId: config.awsCognitoClientId!,
    Username: email,
    Password: password,
    UserAttributes: userAttributes
  });

  return await cognitoService.send(command);
};

export const confirmSignUpWithCognito = async (
  verifyUserParams: VerifyUserParams
) => {
  const { email, verificationCode } = verifyUserParams;
  const command = new ConfirmSignUpCommand({
    ClientId: clientId,
    Username: email,
    ConfirmationCode: verificationCode
  });

  return cognitoService.send(command);
};

export const resendConfirmationCode = async (email: string) => {
  const command = new ResendConfirmationCodeCommand({
    ClientId: clientId,
    Username: email
  });

  return cognitoService.send(command);
};

export const loginUserWithCognito = (loginUserParams: LoginUserParams) => {
  const { email, password } = loginUserParams;

  const command = new InitiateAuthCommand({
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    },
    ClientId: clientId
  });
  return cognitoService.send(command);
};

export const getCognitoUser = async (email: string) => {
  const command = new AdminGetUserCommand({
    UserPoolId: userPoolId,
    Username: email
  });
  return await cognitoService.send(command);
};
