const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const fs = require('fs');
const PTP = require('./core/ptp');
const { log } = require('console');

const app = express();
const port = 3000;
const logger = morgan('dev');

app.use(logger);
app.use(bodyParser.json())

app.use('/static',express.static('static'));

app.get('/', (req, res) => {
  fs.readFile('index.html', (err, content) => { 
    if (!err) {
      res.setHeader('Content-Type','text/html');
      res.status(200);
      res.send(content);
    }
    else {
      console.error(err);
      res.status(500);
      res.send("Error - details in logs");
    }
  });
})

app.post('/hello', (req,res) => {
  let ptp = new PTP();
  answer(res, {'version':ptp.version});
});

app.post('/ping', (req,res) => {
  console.log(req.body);
  res.status(200)
  res.send(JSON.stringify('ok'));
})


app.listen(port, () => {
  console.log(`Started on http://localhost:${port}`);
})

function answer(res, payload) {
  res.status=200;
  res.send(JSON.stringify(payload));
}