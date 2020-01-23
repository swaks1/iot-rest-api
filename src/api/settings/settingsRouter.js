import express from "express";
import controller from "./settingsController";

var router = express.Router();

// every route that ends with :id will first enter here than continue
router.param("name", controller.param);

router
  .route("/")
  .get(controller.get)
  .post(controller.post);

router
  .route("/:name")
  .get(controller.getById)
  .put(controller.putById)
  .delete(controller.deleteById);

// router.route("/reloadDataTypes").post(controller.reloadDataTypes);

export default router;
