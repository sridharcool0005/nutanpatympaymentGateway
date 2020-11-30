const express = require('express')
const path = require('path')
const ejs = require('ejs')
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express()


// Set the view engine to ejs
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(__dirname + '/dist'));
app.set('view engine', 'ejs')


app.use(cors());

// app.use(bodyParser.json(  {extended: true}));
// app.use(bodyParser.urlencoded({ extended: true }));

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname + '/dist/index.html'));
});


app.use('/', require('./Routes/paymentroute'));

const port = 3008
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
})
