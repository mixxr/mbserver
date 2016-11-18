import {MsCartItem} from '../model/client/ms-cart-item';
import {RefreshReport} from '../model/refresh-report';
import {INormalizer} from './i-normalizer';
import {Collection} from 'mongodb';

export class Portia implements INormalizer{

  start(jsonFilename: string, collection: Collection, callback: any ) {
      let fn = jsonFilename.substr(jsonFilename.lastIndexOf('\\')+1);
      let source = fn.split('-')[0]; // shopname

      let defaults = require("./"+source+"-defaults.json");
      let defaultCat = defaults.category;
      let defaultShipCost:number = defaults.shipCost;

      console.log("processing:",fn,', shopname:', source,', defaults:', defaults);

      let report:RefreshReport = new RefreshReport((new Date()).getTime(),[],source,"portia");

      var LineByLineReader = require('line-by-line'),
        lr = new LineByLineReader(jsonFilename);

      lr.on('error', function (err:any) {
        // 'err' contains error object
        console.log("error:", err);
        callback(report);
      });

      lr.on('line', function (line:string) {
        // 'line' contains the current line without the trailing newline character.
        let item = JSON.parse(line);
          report.total++;
          if (item.price === undefined) {
            report.errors++;
            report.errList[item.name] = 'no price';
            process.stdout.write("x");
            return;
          }
          process.stdout.write(".");
          item.brand = item.brand || [defaults.brand];
          let cItem:MsCartItem = new MsCartItem(undefined,item.name[0],getFloat(item.price,undefined), item.brand[0]);
          cItem.crawler = report.crawler;
          cItem.shopname = source;
          cItem.category = item.category[0] || defaultCat;
          // check category
          if (cItem.category == item.brand || cItem.category === undefined) cItem.category = cItem.name.split(' ')[0];
          //TODO: check category w RegEx
          if (cItem.category && report.categories.indexOf(cItem.category) === -1) report.categories.push(cItem.category);
          
          cItem.currency = 'EUR';
          cItem.descriptions = getDescs(item);
          cItem.longDescs = getLongDescs(item);
          let oprice:number = getFloat(item.oldPrice,undefined);
          if (oprice !== undefined && oprice > 0) {
            cItem.oldPrice = oprice;
            cItem.discount = +(100*(oprice - cItem.price)/oprice).toFixed(2);
          }
          cItem.imgUrls = getImgUrls(item);
          cItem.link = (item.buyLink)? item.buyLink[0] : item.url;
          cItem.BOPIS = (item.bopisLink)? item.bopisLink[0] : null;
          cItem.outOfStock = false;
          cItem.qty = 1;
          cItem.sku = (item.sku)?item.sku[0] : getSku(cItem.link, item);
          cItem.secondhand = false;
          cItem.shippedPrice = getFloat(item.shippedPrice,' ');
          cItem.shipCost = (cItem.shippedPrice>0)?cItem.shippedPrice-cItem.price:defaultShipCost;
          cItem.refresh = report.mills;
          if((report.skus[cItem.sku] === undefined)){
            report.skus[cItem.sku] = 1;
            collection.findOneAndReplace({"sku":cItem.sku,"shopname":cItem.shopname},cItem, { upsert : true }, function(err:any,result:any){
              if (!err){
                report.updates += (result.lastErrorObject.updatedExisting)?1:0;
                report.inserts += (result.lastErrorObject.updatedExisting)?0:1;
              }else
                report.errors++;        
            });
          }else{
            report.duplicates++;
            report.skus[cItem.sku]++;
          }
          
      });

      lr.on('end', function () {
        // All lines are read, file is closed now.
        console.log('stream ended. removing old...');
        report.categories.push("null");
        collection.remove({"shopname":report.shopname, "category": { $in: report.categories }, "refresh":{"$lt":report.mills}},function(err:any,res:any){
          if (!err) report.deletes = res.result.n;
          else report.errors++;
        });
        callback(report); 
      });
  }
}


/*
var MongoClient = require('mongodb').MongoClient;  
var collection:any = undefined;
var url = 'mongodb://localhost:27017/mybudget';
var _db:any;
*/


/*console.log("Connecting to server...");
MongoClient.connect(url, function (err:any, db:any) {
  if (err){
    console.log("db is down:", url);
    return;
  }
  console.log("OK");
  _db = db;
  collection = db.collection("items");  
  start();
});
*/
//var counter = 0, n=0;
//var cart:MsCartItem[] = [];



var getFloat = function(s:any,sep:string): number{
  if (s && s[0])
  {
    let str = s[0];
    try{
      if(sep)
        str = str.split(sep)[0];
      if (str.indexOf(",")>str.indexOf(".")) // Italian notation: 1.400,90 EUR
        str = str.replace(".","").replace(",",".")
      return parseFloat(str.replace(/[€$A-Z ]+/,""));
    }catch(e){}
  }
  return 0.00;
}

// var getText = function(s:any){
//   if (s && s[0])
//   {
//     if(s[0].text)
//       return s[0].text;
//     if(s[0].src)
//         return s[0].src;
//     if(s[0].href)
//         return s[0].href;
//   }
//   return undefined;
// }

// accepts url
var getSku = function(sURL:any, fullJson:any): string{
  try{
      let params:string[] = sURL.split('?')[1].split('&');
      let el = params.find((e)=>(e.startsWith('sku') || e.startsWith('prod') || e.startsWith('pid') || e.startsWith('cod')));
      return el.split('=')[1];
  }catch(e){}
  try{
      return sURL.match(/\/[A-Z0-9]+\//g)[0].replace(/\//g,"");
  }catch(e){}
  let ret:string = undefined;
  try{
    fullJson.variants.forEach((v:any)=> {if (v.sku) ret = v.sku[0].match(/[A-Z0-9]+$/g)[0]});
  }catch(e){}

  return ret;
}

var getDescs = function(fullJson:any): string[]{
  let retVal : string[] = [];
  if (fullJson.desc) retVal.push(fullJson.desc);
  if (fullJson.variants)
    fullJson.variants.forEach((v:any)=> {if (v.desc) retVal.push(v.desc[0])});
  return retVal;
}

var getLongDescs = function(fullJson:any): string[]{
  let retVal : string[] = [];
  if (fullJson.longDesc) retVal.push(fullJson.longDesc);
  if (fullJson.variants)
    fullJson.variants.forEach((v:any)=> {if (v.longDesc) retVal.push(v.longDesc[0])});
  return retVal;
}

var getImgUrls = function(fullJson:any): string[]{
  let retVal : string[] = [];
  if (fullJson.imgUrl) retVal.push(fullJson.imgUrl[0]);
  if (fullJson.variants)
    fullJson.variants.forEach((v:any)=> {if (v.imgUrl) retVal.push(v.imgUrl[0])});
  return retVal;
}
