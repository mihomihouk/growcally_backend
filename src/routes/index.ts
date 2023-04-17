import { Router } from "express";
import postRouter from "./post-router";

const router = Router();

router.use(postRouter);

export default router;
