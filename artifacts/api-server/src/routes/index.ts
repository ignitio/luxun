import { Router, type IRouter } from "express";
import healthRouter from "./health";
import collectionsRouter from "./collections";
import essaysRouter from "./essays";

const router: IRouter = Router();

router.use(healthRouter);
router.use(collectionsRouter);
router.use(essaysRouter);

export default router;
