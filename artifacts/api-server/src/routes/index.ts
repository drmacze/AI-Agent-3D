import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentsRouter from "./agents";
import tasksRouter from "./tasks";
import dashboardRouter from "./dashboard";
import activityRouter from "./activity";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/agents", agentsRouter);
router.use("/tasks", tasksRouter);
router.use("/dashboard", dashboardRouter);
router.use("/activity", activityRouter);

export default router;
