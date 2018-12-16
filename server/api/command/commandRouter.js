var router = require('express').Router();
var controller = require('./commandController');
var _ = require('lodash');


router.route('/')
    .get(controller.get)
    .post(controller.post);

router.route('/:id')
    .get(controller.getById);
    
router.route('/notExecuted/:deviceId')
    .get(controller.getNotExecutedCommand)
    .post(controller.postExecutedCommand);

module.exports = router;