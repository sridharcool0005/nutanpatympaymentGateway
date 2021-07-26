
var mysql = require('mysql');
const crypto = require("crypto");


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




module.exports.createprofile = async function (req, res) {
    const {firstname,lastname,designation,orgn_name,mobilenumber,whatsapp,email,address } = req.body;

    if (!firstname||!lastname||!designation||!orgn_name||!mobilenumber||!whatsapp||!email||!address) {
        res.send({
            "code": 200,
            message: "please make sure fields is mandatory",
            status: "error"
        })
    } else {
        const query = "INSERT INTO app_clients_master SET ?";
        let vcard_id = crypto.randomBytes(4).toString("hex");
        let client_id = crypto.randomBytes(4).toString("hex");

        const postvalues = {
            partner_id: 'nutantek',
            client_id: client_id,
            vcard_id: vcard_id,
            firstname: firstname,
            lastname:lastname,
            designation:designation,
            orgn_name:orgn_name,
            country_code:'91',
            mobilenumber:mobilenumber,
            whatsapp:whatsapp,
            email:email,
            address:address,
            vcard_url:'https://digitally.nutanapp.in/vcard/'+mobilenumber,
            account_status:'active'
        }
        console.log(postvalues)
        db2.query(query, postvalues, function (err, result, fields) {
            if (err) throw err;
            console.log(result)
            res.send({
                "code": 200,
                message: "profile created successfully",
                status: "success"
            });
        })

    }
}
