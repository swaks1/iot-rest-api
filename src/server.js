import express from "express";
import { json, urlencoded } from "body-parser";
import morgan from "morgan";
import cors from "cors";
import config from "./config";
import logger from "./utils/logger";
import { signup, signin, protect } from "./utils/auth";
import { connectToDatabase } from "./utils/database";

import apiRouter from "./api";

export const app = express();

app.disable("x-powered-by");

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(morgan("dev"));

app.post("/signup", signup);
app.post("/signin", signin);

// app.use("/api", protect);
app.use("/api", apiRouter);

// set up global error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send("Oops...Internal Server Error\n\n" + err.stack);
});

export const startServer = async () => {
  try {
    var dbConnection = await connectToDatabase();
    if (!dbConnection) return Promise.resolve(false);

    app.listen(config.port, () => {
      logger.log(`REST API on http://localhost:${config.port}/api`);
    });
    return Promise.resolve(true);
  } catch (e) {
    logger.error(e);
    return Promise.resolve(false);
  }
};
