import express from "express";
import v1Router from "./routes/v1";

import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT;

const app = express();
app.use(express.json({ limit: "50mb" }));

const start = async (): Promise<void> => {
  app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
    app.use("/api/v1", v1Router);
  });
};
start();
