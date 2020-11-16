var fs = require('fs');
var transactionTemp;
fs.readFile('transaction_template.json', function(err, data) {
    transactionTemp = JSON.parse(data);

     
});