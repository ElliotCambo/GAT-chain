const SHA256 = require("crypto-js/sha256");
const crypto = require("crypto")
var express = require('express');
var https = require('https');
var fs = require('fs');
const url = require('url');

var privateKey  = fs.readFileSync('/root/vvid/vvid/certs/vvid_world.key', 'utf8');
var certificate = fs.readFileSync('/root/vvid/vvid/certs/bundle.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};

var WebSocket = require('ws');
var jsonParser = require('body-parser');

var currentSessionsStatus = [];
 
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

wss.on('connection', function (ws,req) {
    //send immediatly a feedback to the incoming connection    

    var current_url = new URL("https://bs.com"+req.url);

    // get access to URLSearchParams object
    var search_params = current_url.searchParams;

    // get url parameters
    var id = search_params.get('gatid');
    ws.gatid = id;
    console.log("UUID="+ws.gatid);
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

        console.log(message);
        var j = JSON.parse(message);

         wss.clients.forEach(client => {
              console.log(client.gatid);
              console.log(j.gatid);
              if (client.gatid == j.gatid) {
                  client.send(message);
              } 
          });
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

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

app.get("/createCoins", (req, res) => {
  // let smashingCoin = new CryptoBlockchain();

  var current_url = new URL("https://bs.com"+req.url);
  // get access to URLSearchParams object
  var search_params = current_url.searchParams;
  // get url parameters
  var id = search_params.get('gatid');

  var transactionTemp;
  var pk;
  var sk;
  var trans = [];
  var numToMint = 50;
  fs.readFile('/root/gat/GAT-chain/models/token.json', function(err, data) {
      transactionTemp = JSON.parse(data);

      // fs.readFile('/root/gat/GAT-chain/certs/gat_id_rsa.pub', function(err, data) {
      // pk = data;//.toString('utf8');
       

      //  console.log(pk);

      //   fs.readFile('/root/gat/GAT-chain/certs/gat_id_rsa', function(err, data) {
      //   sk = data;//.toString('utf8');

      //    console.log(sk);
          // const { pk, sk } = crypto.generateKeyPairSync("rsa", {
          //   // The standard secure default length for RSA keys is 2048 bits
          //   modulusLength: 2048,
          // })

          // const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
          //           namedCurve: 'sect239k1',
          //           publicKeyEncoding:  { type: 'spki', format: 'der' },
          //           privateKeyEncoding: { type: 'pkcs8', format: 'der' }
          //         });


          console.log("loaded  keys and template");
          var TransactionGuuid = uuidv4();
          for(i = 0; i < numToMint;){
            var transactionTempCOPY = transactionTemp;
            var guuid = uuidv4();
            // const data = guuid;

            // const encryptedData = crypto.publicEncrypt(
            //   {
            //     key: pk,
            //     padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            //     oaepHash: "sha256",
            //   },
            //   // We convert the data string to a buffer using `Buffer.from`
            //   Buffer.from(data)
            // )

            // The encrypted data is in the form of bytes, so we print it in base64 format
            // so that it's displayed in a more readable form
            // console.log("encypted data: ", encryptedData.toString("base64"))

            var seconds = new Date().getTime() / 1000;
            transactionTempCOPY.uuid = guuid;
            transactionTempCOPY.to_account_holder_id = id;
            transactionTempCOPY.from_account_holder_id = "GENERSIS";
            transactionTempCOPY.transaction_currency_symbol = "GAT";
            transactionTempCOPY.transaction_currency_symbol = "gat";
            transactionTempCOPY.value = 1;
            transactionTempCOPY.created  = seconds;
            transactionTempCOPY.owner_chain = ["GENERSIS"];

            
            trans.push(transactionTempCOPY);

            i++;
          }

          console.log(trans);

          var seconds = new Date().getTime() / 1000;

          var lastBlock=GATTransacitonChain.obtainLatestBlock();
          var cid =  lastBlock.index;

          GATTransacitonChain.addNewBlock(
              new CryptoBlock(cid+1, seconds, trans)
          );



          var lastBlock=GATTransacitonDetailsChain.obtainLatestBlock();
          var cid =  lastBlock.index;

          var time = new Date();

          var infoObj = { 
                          trasactionId:TransactionGuuid,
                          value:numToMint,
                          currency:"gat",
                          time:time.toString(),
                          to_account_holder_id:id,
                          from_account_holder_id:"GENERSIS"
                        };

          GATTransacitonDetailsChain.addNewBlock(
              new CryptoTransacitonDetailsBlock(cid+1, seconds, infoObj)
          );


          res.sendStatus(200);
         
    //   });
    // }); 
  });

});


app.get("/getTransactionChain", (req, res) => {
  // let smashingCoin = new CryptoBlockchain();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({action:"updateChain",chain:GATTransacitonChain}));
});



app.get("/getTransactionInfoChain", (req, res) => {
  // let smashingCoin = new CryptoBlockchain();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({action:"updateChain",chain:GATTransacitonDetailsChain}));
});


app.post("/addNewTransaction", (req, res) => {
  console.log("New block being added");

  var coins = req.body.coins;
  var value = req.body.value;
  var toAccountId = req.body.toAccountId;
  var fromAccountId = req.body.fromAccountId;
  var currency = req.body.currency;


  var transactionTemp;
  var trans = [];
  // let smashingCoin = new CryptoBlockchain();
  console.log("smashingCoin mining in progress....");
  var seconds = new Date().getTime() / 1000;
  fs.readFile('/root/gat/gat/GAT-chain/models/token.json', function(err, data) {
      transactionTemp = JSON.parse(data);

      var TransactionGuuid = uuidv4();

      for(i = 0; i < coins.length;){
        var transactionTempCOPY = transactionTemp;
        var guuid = uuidv4();
        // const data = guuid;

        // const encryptedData = crypto.publicEncrypt(
        //   {
        //     key: pk,
        //     padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        //     oaepHash: "sha256",
        //   },
        //   // We convert the data string to a buffer using `Buffer.from`
        //   Buffer.from(data)
        // )

        // The encrypted data is in the form of bytes, so we print it in base64 format
        // so that it's displayed in a more readable form
        // console.log("encypted data: ", encryptedData.toString("base64"))

        var seconds = new Date().getTime() / 1000;
        transactionTempCOPY.uuid = guuid;
        transactionTempCOPY.to_account_holder_id = toAccountId;
        transactionTempCOPY.from_account_holder_id = fromAccountId;
        transactionTempCOPY.transaction_currency_symbol = currency;
        transactionTempCOPY.transaction_currency_symbol = currency;
        transactionTempCOPY.value = 1;
        transactionTempCOPY.created  = seconds;
        transactionTempCOPY.owner_chain = coins[i].owner_chain.push(toAccountId);

        
        trans.push(transactionTempCOPY);

        i++;
      }

      console.log(trans);

      var seconds = new Date().getTime() / 1000;

      var lastBlock=GATTransacitonChain.obtainLatestBlock();
      var cid =  lastBlock.index;

      GATTransacitonChain.addNewBlock(
          new CryptoBlock(cid+1, seconds, trans)
      );


      var lastBlock=GATTransacitonDetailsChain.obtainLatestBlock();
      var cid =  lastBlock.index;

      var time = new Date();

      var infoObj = { 
                      trasactionId:TransactionGuuid,
                      value:coins.length,
                      currency:currency,
                      time:time.toString(),
                      to_account_holder_id:toAccountId,
                      from_account_holder_id:fromAccountId
                    };

      GATTransacitonDetailsChain.addNewBlock(
          new CryptoTransacitonDetailsBlock(cid+1, seconds, infoObj)
      );

      wss.clients.forEach(client => {
          if (client.gatid == toAccountId) {
              client.send(JSON.stringify({action:"updateChain",chain:GATTransacitonChain}));
          } 
      });

      console.log(JSON.stringify(trans));
      // res.sendStatus(200);

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({action:"updateChain",chain:GATTransacitonChain}));

  });
  
});



app.get("/getIdentityChain", (req, res) => {
  // let smashingCoin = new CryptoBlockchain();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({action:"updateChain",chain:GATidenityChain}));
});

app.get("/.well-known/pki-validation/AB220C4E12766858646D251DF78D5BBD.txt", (req, res) => {
  // let smashingCoin = new CryptoBlockchain();
  // res.setHeader('Content-Type', 'application/json');



  res.send("CE657A8D0302B74CE88FBEB9804406426D850E714EF03C40F965833F4894BEEA comodoca.com 6162ce6d3f22c");
});

AB220C4E12766858646D251DF78D5BBD.txt

app.post("/addNewIdenity", (req, res) => {
  // console.log("New block being added :" + JSON.stringify(req.body));

  
  // let smashingCoin = new CryptoBlockchain();
  console.log("smashingCoin mining in progress....");
   var seconds = new Date().getTime() / 1000;

  var idenity = req.body.idenity;
  var account = req.body.account;
   
  console.log(idenity);
  
  console.log(account);

  var lastBlock=GATidenityChain.obtainLatestBlock();
  var cid = lastBlock.index;
           
  GATidenityChain.addNewBlock(
    new CryptoIdenityBlock(cid+1, seconds, idenity)
  );

  var lastBlock=GATAccountsChain.obtainLatestBlock();
  var cid = lastBlock.index;
           
  GATAccountsChain.addNewBlock(
    new CryptoAccountBlock(cid+1, seconds, account)
  );

  wss.clients.forEach(client => {
      if (client != wss) {
          client.send(JSON.stringify({action:"updateChain",identityChain:GATidenityChain,accountChain:GATAccountsChain}));
      } 
  });

  console.log(JSON.stringify(GATidenityChain));

  // res.sendStatus(200);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({action:"updateChain",identityChain:GATidenityChain,accountChain:GATAccountsChain,transactionChain:GATTransacitonChain}));

});


app.get("/genkeys", (req, res) => {
  const { generateKeyPair } = require('crypto');
  generateKeyPair('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: ""
    }
  }, (err, publicKey, privateKey) => {
    // Handle errors and use the generated key pair.
     console.log(publicKey);
     console.log(privateKey);
     res.setHeader('Content-Type', 'application/json');
     res.send(JSON.stringify({pk:publicKey,sk:privateKey}));
  });
});

app.get("/getAccountsChain", (req, res) => {
  // let smashingCoin = new CryptoBlockchain();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({action:"updateChain",chain:GATAccountsChain}));
});


app.get("/getFiscalChain", (req, res) => {
  // let smashingCoin = new CryptoBlockchain();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({action:"updateChain",chain:GATFiscalChain}));
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
    this.difficulty = 1;
  }
  startGenesisBlock() {
    var today = new Date();
    var date = today.getTime() / 1000
    console.log("Initial Block in the TRANSACTION Chain");
    return new CryptoBlock(0, date, "Initial Block in the TRANSACTION Chain", "0");
  }

  obtainLatestBlock() {
    return this.blockchain[this.blockchain.length - 1];
  }
  addNewBlock(newBlock) {
    newBlock.precedingHash = this.obtainLatestBlock().hash;
    newBlock.hash = newBlock.computeHash();
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
 let GATTransacitonChain = new CryptoBlockchain();  














class CryptoIdenityBlock {
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

class CryptoIdenityBlockchain {
  constructor() {
    this.blockchain = [this.startGenesisBlock()];
    this.difficulty = 1;
  }
  startGenesisBlock() {
    var today = new Date();
    var date = today.getTime() / 1000
    console.log("Initial Block in the IDENTITY Chain");
    return new CryptoIdenityBlock(0, date, "Initial Block in the IDENTITY Chain", "0");
  }

  obtainLatestBlock() {
    return this.blockchain[this.blockchain.length - 1];
  }
  addNewBlock(newBlock) {
    newBlock.precedingHash = this.obtainLatestBlock().hash;
    newBlock.hash = newBlock.computeHash();
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

 let GATidenityChain = new CryptoIdenityBlockchain();  




















class CryptoAccountBlock {
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

class CryptoAccountBlockchain {
  constructor() {
    this.blockchain = [this.startGenesisBlock()];
    this.difficulty = 1;
  }
  startGenesisBlock() {
    var today = new Date();
    var date = today.getTime() / 1000
    console.log("Initial Block in the ACCOUNT Chain");
    return new CryptoAccountBlock(0, date, "Initial Block in the IDENTITY Chain", "0");
  }

  obtainLatestBlock() {
    return this.blockchain[this.blockchain.length - 1];
  }
  addNewBlock(newBlock) {
    newBlock.precedingHash = this.obtainLatestBlock().hash;
    newBlock.hash = newBlock.computeHash();
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

 let GATAccountsChain = new CryptoAccountBlockchain();  

















class CryptoFiscalBlock {
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

class CryptoFiscalBlockchain {
  constructor() {
    this.blockchain = [this.startGenesisBlock()];
    this.difficulty = 1;
  }
  startGenesisBlock() {
    var today = new Date();
    var date = today.getTime() / 1000
    console.log("Initial Block in the FISCAL Chain");
    return new CryptoFiscalBlock(0, date, "Initial Block in the FISCAL Chain", "0");
  }

  obtainLatestBlock() {
    return this.blockchain[this.blockchain.length - 1];
  }
  addNewBlock(newBlock) {
    newBlock.precedingHash = this.obtainLatestBlock().hash;
    newBlock.hash = newBlock.computeHash();
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

 let GATFiscalChain = new CryptoFiscalBlockchain();  























class CryptoTransacitonDetailsBlock {
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

class CryptoTransacitonDetailsBlockchain {
  constructor() {
    this.blockchain = [this.startGenesisBlock()];
    this.difficulty = 1;
  }
  startGenesisBlock() {
    var today = new Date();
    var date = today.getTime() / 1000
    console.log("Initial Block in the IDENTITY Chain");
    return new CryptoIdenityBlock(0, date, "Initial Block in the IDENTITY Chain", "0");
  }

  obtainLatestBlock() {
    return this.blockchain[this.blockchain.length - 1];
  }
  addNewBlock(newBlock) {
    newBlock.precedingHash = this.obtainLatestBlock().hash;
    newBlock.hash = newBlock.computeHash();
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

 let GATTransacitonDetailsChain = new CryptoTransacitonDetailsBlockchain();  



