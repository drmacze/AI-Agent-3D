import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentsRouter from "./agents";
import tasksRouter from "./tasks";
import dashboardRouter from "./dashboard";
import activityRouter from "./activity";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/agents", agentsRouter);
router.use("/tasks", tasksRouter);
router.use("/dashboard", dashboardRouter);
router.use("/activity", activityRouter);
router.use("/chat", chatRouter);

export default router;
