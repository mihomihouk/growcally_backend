import { expressInitializer } from './init/express';
import Router from './routes';
import express from 'express';

const port = parseInt(process.env.PORT || '5000', 10);

const start = async () => {
  const app = expressInitializer();
  app.use(express.json({ limit: '50mb' }));
  app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
  });
  app.use('/api/v1', Router);
};
start();
