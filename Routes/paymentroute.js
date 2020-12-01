
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');


const checksum_lib = require('../Paytm/checksum')
const config = require('../Paytm/config')

// Middleware for body parsing
const parseUrl = bodyParser.urlencoded({ extended: false })
const parseJson = bodyParser.json({ extended: false })

const paymentController= require('../controllers/paymentcontroller');

router.get('/getorderconfirm',[parseUrl, parseJson],paymentController.getOrderConfirm);

router.post('/getorderDetails',[parseUrl, parseJson],paymentController.getorderDetails);


router.post('/paynow', [parseUrl, parseJson],  paymentController.payNow );

router.post('/callback', paymentController.callBack);


module.exports = router;