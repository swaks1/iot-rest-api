var router = require('express').Router();

//api router will mount other routers for all resources
router.use('/devices', require('./device/deviceRouter'));
router.use('/data', require('./data/dataRouter'));
router.use('/command', require('./command/commandRouter'));

module.exports = router;