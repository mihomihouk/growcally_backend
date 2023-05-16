import { expressInitializer } from './init/express';
import Router from './routes';
import express from 'express';

const port = 5000;

const start = async (): Promise<void> => {
  const app = expressInitializer();
  app.use(express.json({ limit: '50mb' }));
  app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
  });
  app.use('/api/v1', Router);
};
start();
