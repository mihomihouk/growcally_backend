import express from 'express';
import Router from './routes';

import dotenv from 'dotenv';
import { expressInitializer } from './init/express';

dotenv.config();

const port = 5000;

const start = async (): Promise<void> => {
  const app = expressInitializer();
  app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
    app.use('/api/v1', Router);
  });
};
start();
