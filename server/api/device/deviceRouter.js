var router = require('express').Router();
var logger = require('../../util/logger');
var controller = require('./deviceController');

//every route that ends with :id will first enter here than continue
router.param('id', controller.params);

router.route('/')
    .get(controller.get)
    .post(controller.post);

router.route('/:id')
    .get(controller.getById)
    .put(controller.putById)
    .delete(controller.deleteById);

module.exports = router;