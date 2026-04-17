import { Router, type IRouter } from "express";
import healthRouter from "./health";
import collectionsRouter from "./collections";
import essaysRouter from "./essays";
import authRouter from "./auth";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(collectionsRouter);
router.use(essaysRouter);
router.use(authRouter);
router.use(adminRouter);

export default router;
