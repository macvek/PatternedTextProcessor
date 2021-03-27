const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const fs = require('fs');
const PTP = require('./core/ptp');

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
  answer(res, {pong:req.body.ping})
})

app.post('/evaluate', (req,res) => {
  const ptpInput = req.body.ptp;
  const source = req.body.source;

  let ptp = new PTP(ptpInput);
  answer(res, evaluatePtp(ptp, source));
})

app.post('/sample', (req,res) => {
  const sample = req.body.sample;
  if (typeof sample !== 'string') {
    answer(res, {failed:'Expected string as sample'});
    return;
  }
  
  let ptp = new PTP([
    {call: 'arraySplit', key:' '},
    {call: 'store', key:'${key1}', source: {call:'arrayPick', idx:0}},
    {call: 'store', key:'${key2}', source: {call:'arrayPick', idx:1}},
    {call: 'store', key:'${key3}', source: {call:'arrayPick', idx:2}},
    {call: 'array', array:['Fixed Prefix', '${key3}', '${key2}', '${key1}', 'Fixed Suffix']},
    {call: 'arrayJoin', 'key': ' > '}
  ]);

  answer(res, evaluatePtp(ptp, sample));
})

app.listen(port, () => {
  console.log(`Started on http://localhost:${port}`);
})

function answer(res, payload) {
  res.status=200;
  res.send(JSON.stringify(payload));
}

function evaluatePtp(ptp, input) {
  try {
    let parsed = ptp.parseInput(input);
    return {
      result: parsed,
      trace: ptp.lastWalker.trace
    }
  }
  catch(e) {
    return {
      failedWithError:e
    }
  }
}