
const express = require('express');
const router = express.Router();
const https = require('https')
const qs = require('querystring')
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

router.post('/callback', (req, res) => {
    console.log('hello', req.body)
    var body = '';
  
    req.on('data', function (data) {
        console.log(data)
        body += data;
    });
  
    req.on('end', function () {
      var html = "";
      var post_data = qs.parse(body);
  
      // received params in callback
      console.log('Callback Response: ', post_data, "\n");
  
  
      // verify the checksum
      var checksumhash = post_data.CHECKSUMHASH;
      // delete post_data.CHECKSUMHASH;
      var result = checksum_lib.verifychecksum(post_data, config.PaytmConfig.key, checksumhash);
      console.log("Checksum Result => ", result, "\n");
  
  
      // Send Server-to-Server request to verify Order Status
      var params = { "MID": config.PaytmConfig.mid, "ORDERID": post_data.ORDERID };
  
      checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
  
        params.CHECKSUMHASH = checksum;
        post_data = 'JsonData=' + JSON.stringify(params);
  
        var options = {
          hostname: 'securegw-stage.paytm.in', // for staging
          // hostname: 'securegw.paytm.in', // for production
          port: 443,
          path: '/merchant-status/getTxnStatus',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': post_data.length
          }
        };
  
  
        // Set up the request
        var response = "";
        var post_req = https.request(options, function (post_res) {
          post_res.on('data', function (chunk) {
            response += chunk;
          });
  
          post_res.on('end', function () {
            console.log('S2S Response: ', response, "\n");
  
            var _result = JSON.parse(response);
            res.render('response', {
              'data': _result
            })
          });
        });
  
        // post the data
        post_req.write(post_data);
        post_req.end();
      });
    });
  })


module.exports = router;