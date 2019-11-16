import express from "express";
import controller from "./dataController";
// import _ from "lodash";
var router = express.Router();

// every route that ends with :id will first enter here than continue
router.param("id", controller.param);

router
  .route("/")
  .get(controller.get)
  .post(controller.post)
  .delete(controller.delete);

router.route("/:id").get(controller.getById);

export default router;
