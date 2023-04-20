import express from "express";
import Router from "./routes";
import cors from "cors";
import { corsOptions } from "../config/corsOptions";

import dotenv from "dotenv";

dotenv.config();

const port = 5000;

const app = express();
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));

const start = async (): Promise<void> => {
  app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
    app.use("/api/v1", Router);
  });
};
start();
