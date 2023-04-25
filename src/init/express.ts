import express, { Application } from 'express';
// import { setupCors } from '../../config/cors';
import cors from 'cors';

export const expressInitializer = (): Application => {
  const app = express();
  // setupCors(app);

  app.use(express.json({ limit: '50mb' }));
  const corsOptions = {
    origin: ['http://localhost:3000', 'https://growcally.onrender.com'],
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 200
  };

  // The second line sets up a pre-flight request handler that responds to all
  // 'OPTIONS' requests with the appropriate CORS headers allowing the browser
  // to proceed with the actual request
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  return app;
};
