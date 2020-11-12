const {google} = require('googleapis');
const APIKEY = require('./*.json');



exports.hot = function() {     //use exports.funcName = function (parameters) bc it's how node.js does it
    var coinFlip = (Math.floor(Math.random() * 10)) + 1;
    if((coinFlip % 2) == 0)
        return 'Heads';
    else
        return 'Tails';
 
}





