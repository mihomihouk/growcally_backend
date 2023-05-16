import express, { Application } from 'express';
import { setupCors } from '../../config/cors';
import cookieParser from 'cookie-parser';

export const expressInitializer = (): Application => {
  const app = express();
  setupCors(app);
  app.use(cookieParser());

  return app;
};
