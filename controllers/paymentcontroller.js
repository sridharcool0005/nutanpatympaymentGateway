
var mysql = require('mysql');
const request = require('request');
const https = require('https')
const qs = require('querystring')

const checksum_lib = require('../Paytm/checksum')
const config = require('../Paytm/config')


var db1 = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'smsportal',
    debug: false,
});

var db2 = mysql.createConnection({
    host: 'localhost',
    user: 'smsdba_smsdba2',
    password: 'nnv9I^b7KantGk',
    database: 'smsdba_ntsmsdb',
    debug: false,
  
  });


module.exports.getOrderConfirm = async function (req, res) {
    const { agent_id, order_id } = req.query;
    const smsportal_authkey = req.headers['authorization'];
    if (!agent_id || !order_id) {
        res.status(400).send({
            message: "please make sure fields are mandatory",
            status: "error"
        })
    } else if (!smsportal_authkey) {
        res.status(400).send({
            message: "please make sure smsportal_authkey is mandatory",
            status: "error"
        })

    } else {

        const query1 = "SELECT `smsportal_authkey` FROM `app_clients_master` WHERE `agent_id` =?"
        await db2.query(query1,[agent_id], function (err, response, fields) {
            if (!response.length) {
                res.status(400).send({
                    status: "error",
                    message: 'authentication failed'
                });
            } else {
                const authkey = response[0].smsportal_authkey;
                if (authkey === smsportal_authkey) {
                    res.send({
                        status: "success",
                        paygateway_url:'http://payment.nutanapp.in/confirmOrder/'+order_id

                    });
                }
                else {
                    res.status(400).send({
                        status: "error",
                        message: 'authentication failed'
                    });
                }
            }
        });
    }

}



module.exports.getorderDetails = async (req,res) => {

    const orderIdApi='https://portalapi.nutansms.in/fetchOrderdetailsV1.php';
 
 
    const options = {
      url: orderIdApi,
      qs: { order_id: req.body.order_id},
      headers: {
        'Authorization': 'nh7bhg5f*c#fd@sm9'
      },
    
      json: true,
      method: 'Post',
    }
    request(options, (err, response, body) => {
    

      if (err) {
        res.json(err)
      } else {
        res.json(body)

      }
    });
  


}

module.exports.payNow = (req, res) => {
    if (!req.body.amount || !req.body.email || !req.body.phone||!req.body.order_id) {
        res.status(400).send('Payment failed')
      } else {
        var params = {};
        params['MID'] = config.PaytmConfig.mid;
        params['WEBSITE'] = config.PaytmConfig.website;
        params['CHANNEL_ID'] = 'WEB';
        params['INDUSTRY_TYPE_ID'] = 'Retail';
        params['ORDER_ID'] = req.body.order_id;
        params['CUST_ID'] = 'customer_001';
        params['TXN_AMOUNT'] = req.body.amount.toString();
        params['CALLBACK_URL'] = 'http://localhost:3008/callback';
        params['EMAIL'] = req.body.email;
        params['MOBILE_NO'] = req.body.phone.toString();
    
        checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
          var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
          // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production
    
          var form_fields = "";
          for (var x in params) {
            form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
          }
          form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";
    
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
          res.end();
        });
      }
}

module.exports.callBack = (req, res) => {
  var body = '';

  req.on('data', function (data) {
      // console.log(data)
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
    // console.log("Checksum Result => ", result, "\n");


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
          
          postpaymentTransaction(_result);
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
}


const postpaymentTransaction = (_result) => {
  const data=_result;
  
  try {
    // console.log('sending password to smsportal')
    return new Promise((resolve, reject) => {
      const api = 'https://portalapi.nutansms.in/postPaymentTransactionwebV5.php';
      const options = {
        url: api,
        body: {
          order_id:data.ORDERID,
          total_amount_paid:data.TXNAMOUNT,
          payment_mode:data.PAYMENTMODE,
          payment_gateway_txn_id:data.BANKTXNID,
          payment_gateway_txn_ref: data.TXNID,
          payment_status_code :data.STATUS,
          notes: data.RESPMSG,
          txntype: data.TXNTYPE,
          gatewayname:data.GATEWAYNAME,
          bankname: data.BANKNAME,
          mid :data.MID,
          refundamt : data.REFUNDAMT
        },

        headers: {
          Authorization: 'nh7bhg5f*c#fd@sm9'
        },
        json: true,
        method: 'POST',
      }
      // console.log(options)
      request(options, (err, response, body) => {
        if (err) {
          console.log(err)
          reject(err);
        } else {
          // console.log(body, 'body')
          resolve(true);
        }
      });
    })
  } catch (e) {
    throw e
  }
}
