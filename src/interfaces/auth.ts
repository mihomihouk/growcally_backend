export interface UserParams {
  name: string;
  email: string;
  password: string;
  givenName: string;
  familyName: string;
}

export interface VerifyUserParams {
  email: string;
  verificationCode: string;
}

export interface LoginUserParams {
  email: string;
  password: string;
}
export interface RefreshTokenParams {
  email: string;
  password: string;
}
