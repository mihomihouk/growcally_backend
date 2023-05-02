const generalConfig = {
  awsRegion: process.env.AWS_REGION,
  //Cognito
  awsCognitoClientId: process.env.AWS_COGNITO_CLIENT_ID,
  awsCognitoClientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
  awsCognitoPoolId: process.env.AWS_COGNITO_POOL_ID,
  awsCognitoOAuthDomain: process.env.AWS_COGNITO_OAUTH_DOMAIN,

  //S3
  bucketAccessKey: process.env.BUCKET_ACCESS_KEY!,
  bucketSecretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY!
};

const config = { ...generalConfig };

export type IConfig = typeof config;

export default config;
