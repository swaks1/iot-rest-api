import express from "express";
import controller from "./commandController";
// import _ from "lodash";

var router = express.Router();

router
  .route("/")
  .get(controller.get)
  .post(controller.post);

router.route("/:id").get(controller.getById);

router
  .route("/notExecuted/:deviceId")
  .get(controller.getNotExecutedCommand)
  .post(controller.postExecutedCommand);

router
  .route("/GetGoogleCertificate/Thumbprint")
  .get(controller.getGoogleApiCert);

export default router;
