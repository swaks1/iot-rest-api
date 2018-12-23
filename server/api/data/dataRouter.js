var router = require('express').Router();
var controller = require('./dataController');
var _ = require('lodash');

//every route that ends with :id will first enter here than continue
router.param('id', controller.param);

router.route('/')
    .get(controller.get)
    .post(controller.post)
    .delete(controller.delete);

router.route('/:id')
    .get(controller.getById);    

module.exports = router;