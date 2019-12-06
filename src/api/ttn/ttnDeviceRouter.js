import express from "express";
import controller from "./ttnDeviceController";

var router = express.Router();

// every route that ends with :id will first enter here than continue
router.param("id", controller.param);

router.route("/").get(controller.get);
// .post(controller.post);

router.route("/:id").get(controller.getById);
// .put(controller.putById)
// .delete(controller.deleteById);

export default router;
