import {
  SignUpCommand,
  CognitoIdentityProviderClient,
  SignUpCommandOutput
} from '@aws-sdk/client-cognito-identity-provider';
import config from '../../../config';
import { UserParams } from '../../interfaces/auth';

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
