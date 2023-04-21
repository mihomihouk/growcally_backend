import cors from 'cors';
import { allowedOrigins } from './allowedOrigins';
import { Application } from 'express';

// This gives some origins an access to server while blocking others
export const setupCors = (app: Application): void => {
  const corsOptions = {
    origin: allowedOrigins,
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'X-Access-Token'
    ],
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 200
  };

  // The second line sets up a pre-flight request handler that responds to all
  // 'OPTIONS' requests with the appropriate CORS headers allowing the browser
  // to proceed with the actual request
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
};
