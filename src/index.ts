import express, { Application } from 'express';
import { setupCors } from '../config/cors';
import { expressInitializer } from './init/express';
import Router from './routes';

const port = 5000;

const start = async (): Promise<void> => {
  const app = expressInitializer();
  app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
  });
  app.use('/api/v1', Router);
};
start();
