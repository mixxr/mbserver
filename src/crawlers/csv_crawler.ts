

//Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({constructResult:false});  
 
//record_parsed will be emitted each csv row being processed 
converter.on("record_parsed", function (jsonObj:any) {
   console.log(jsonObj); //here is your result json object 
});
 
require("request").get("http://csvwebserver").pipe(converter);
 