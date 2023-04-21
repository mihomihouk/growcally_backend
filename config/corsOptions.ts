import { allowedOrigins } from './allowedOrigins';

export const corsOptions = {
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
