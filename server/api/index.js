var router = require('express').Router();

//api router will mount other routers for all resources
router.use('/devices', require('./device/deviceRouter'));


module.exports = router;