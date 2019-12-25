import express from "express";
import controller from "./deviceController";

var router = express.Router();

// every route that ends with :id will first enter here than continue
router.param("id", controller.param);

router
  .route("/")
  .get(controller.get)
  .post(controller.post);

router
  .route("/:id")
  .get(controller.getById)
  .put(controller.putById)
  .delete(controller.deleteById);

router.route("/reloadDataTypes").post(controller.reloadDataTypes);
router.route("/LogIn").post(controller.LoginRegister);
router.route("/modifyTTNInfo").post(controller.modifyTTNInfo);

export default router;
