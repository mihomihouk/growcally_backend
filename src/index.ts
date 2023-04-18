import express from "express";
import v1Router from "./routes";
import cors from "cors";
import { corsOptions } from "../config/corsOptions";

import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT;

const app = express();
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));

const start = async (): Promise<void> => {
  app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
    app.use("/api/v1", v1Router);
  });
};
start();
