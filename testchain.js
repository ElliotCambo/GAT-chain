const SHA256 = require("crypto-js/sha256");
var express = require('express');
var https = require('https');
var fs = require('fs');

var privateKey  = fs.readFileSync('/root/vvid/certs/vvid_world.key', 'utf8');
var certificate = fs.readFileSync('/root/vvid/certs/bundle.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};

var WebSocket = require('ws');
var jsonParser = require('body-parser');

var currentSessionsStatus = [];
 let smashingCoin = new CryptoBlockchain();
const app = express();
// parse application/x-www-form-urlencoded
app.use(jsonParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(jsonParser.json())
app.use("/public", express.static("/root/vvid/public"));
//initialize a simple http server
// const server = http.createServer(app);
const server = https.createServer(credentials, app);



//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', function (ws) {
    //send immediatly a feedback to the incoming connection    
    console.log(JSON.stringify(wss._server._connections));
    ws.send('Hi there, GAT WebSocket server');
    
});

wss.on('connection', function (ws) {
    ws.isAlive = true;
    ws.on('pong', function () {
        ws.isAlive = true;
    });
    //connection is up, let's add a simple simple event
    ws.on('message', function (message) {
        //[...]
    });
});

setInterval(function () {
    wss.clients.forEach(function (ws) {
        if (!ws.isAlive)
            return ws.terminate();
        ws.isAlive = false;
        ws.ping(null, false, true);
    });
}, 10000);


app.get("/getChain", (req, res) => {
  res.send(JSON.stringify({action:"updateChain",chain:JSON.stringify(smashingCoin)}));
});

app.post("/addNewBlock", (req, res) => {
  console.log("New block being added");

  var seconds = new Date().getTime() / 1000;

 

  console.log("smashingCoin mining in progress....");
  smashingCoin.addNewBlock(
    new CryptoBlock(1, "01/06/2020", {
      sender: "Iris Ljesnjanin",
      recipient: "Cosima Mielke",
      quantity: 50
    })
  );

  wss.clients.forEach(client => {
      if (client != wss) {
      
          client.send(JSON.stringify({action:"updateChain",chain:JSON.stringify(smashingCoin)}));
      } 
  });

  console.log(JSON.stringify(smashingCoin));

  res.sendStatus(200);

});

server.listen(process.env.PORT || 4433, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});


class CryptoBlock {
  constructor(index, timestamp, data, precedingHash = " ") {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.precedingHash = precedingHash;
    this.hash = this.computeHash();
    this.nonce = 0;
  }

  computeHash() {
    return SHA256(
      this.index +
        this.precedingHash +
        this.timestamp +
        JSON.stringify(this.data) +
        this.nonce
    ).toString();
  }

  proofOfWork(difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.computeHash();
    }
  }
}

class CryptoBlockchain {
  constructor() {
    this.blockchain = [this.startGenesisBlock()];
    this.difficulty = 4;
  }
  startGenesisBlock() {
    return new CryptoBlock(0, "01/01/2020", "Initial Block in the Chain", "0");
  }

  obtainLatestBlock() {
    return this.blockchain[this.blockchain.length - 1];
  }
  addNewBlock(newBlock) {
    newBlock.precedingHash = this.obtainLatestBlock().hash;
    //newBlock.hash = newBlock.computeHash();
    newBlock.proofOfWork(this.difficulty);
    this.blockchain.push(newBlock);
  }

  checkChainValidity() {
    for (let i = 1; i < this.blockchain.length; i++) {
      const currentBlock = this.blockchain[i];
      const precedingBlock = this.blockchain[i - 1];

      if (currentBlock.hash !== currentBlock.computeHash()) {
        return false;
      }
      if (currentBlock.precedingHash !== precedingBlock.hash) return false;
    }
    return true;
  }
}

