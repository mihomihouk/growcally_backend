import express from 'express';
import Router from './routes';
import cors from 'cors';
import { corsOptions } from '../config/corsOptions';

import dotenv from 'dotenv';

dotenv.config();

const port = 5000;

const app = express();
// These two lines give access to some origins while blocking others
// The second line sets up a pre-flight request handler that responds to all
// 'OPTIONS' requests with the appropriate CORS headers allowing the browser
// to proceed with the actual request
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));

const start = async (): Promise<void> => {
  app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
    app.use('/api/v1', Router);
  });
};
start();
