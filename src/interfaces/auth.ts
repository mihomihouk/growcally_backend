export interface UserParams {
  name: string;
  email: string;
  password: string;
  givenName: string;
  familyName: string;
}

export interface VerifyUserParams {
  userSub: string;
  verificationCode: string;
}
