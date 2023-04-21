import express, { Application } from 'express';
import { setupCors } from '../../config/cors';

export const expressInitializer = (): Application => {
  const app = express();
  setupCors(app);
  app.use(express.json({ limit: '50mb' }));

  return app;
};
