
import {RefreshReport} from '../model/refresh-report';
import {INormalizer} from './i-normalizer';

var saveJSON = function (obj:any, filename: string){
  var jsonfile = require('jsonfile');
  jsonfile.writeFileSync(filename, obj)
}

if (process.argv.length !== 4){
  console.log("please use 'node loader <normalizerName> <shopName-fileName.json>");
  
  process.exit(1);
}
//var normalizer = require('./'+process.argv[2])[process.argv[2]].prototype;
//var normalizer2:INormalizer = <INormalizer> require('./'+process.argv[2])();

var MongoClient = require('mongodb').MongoClient;  
var url = 'mongodb://localhost:27017/mybudget';
var _db: any;
var ts1:number;

console.log("> connecting to server...");
MongoClient.connect(url, function (err:any, db:any) {
  if (err){
    console.log("db is down:", url);
    return;
  }
  console.log("> normalizerName:",process.argv[2],", jsonfile:",process.argv[3]);
  _db = db;
  ts1 = Date.now();
  require('./'+process.argv[2])[process.argv[2]].prototype.start(process.argv[3], db.collection("items"), callback);
});


var callback = function(report:RefreshReport){
  let ts2 = Date.now();

  console.log('> report:',report); 

  // save report to <filepath>-<ts>.json
  let repName = process.argv[3].replace(".","-")+"-report"+ts2+".json";
  //saveJSON(report,repName);
  console.log('> report:',repName); 

  _db.close();
  console.log("> finish in "+(ts2-ts1)+"ms");

}

