import express from "express";
import deviceRouter from "./device/deviceRouter";
import dataRouter from "./data/dataRouter";
import commandRouter from "./command/commandRouter";
import userRouter from "./user/user.router";

var router = express.Router();

// api router will mount other routers for all resources
router.use("/devices", deviceRouter);
router.use("/data", dataRouter);
router.use("/command", commandRouter);
router.use("/user", userRouter);

export default router;
