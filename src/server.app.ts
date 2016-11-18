import * as express from 'express';
import * as bodyParser from 'body-parser';
import {SingleRequest} from "./model/single-request";
import {MsCartItem} from "./model/client/ms-cart-item";
import {DAL} from "./dal";

export class MBServer {
  
  app: express.Application;
  dal: DAL<MsCartItem>;


  constructor(){
    this.app = express();
    this.config();
    this.routes();
  }

  private config(){
    this.app.use(bodyParser.urlencoded({extended: true}));
    this.app.use(bodyParser.json());
    this.app.use(function(req:any, res:any, next:any) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });
  } // config

  private routes() {
    let router: express.Router;
    let me = this;
    router = express.Router();
    router.get('/', function (req:any, res:any) {
      console.log("GET-request-param: ",req.query.budget);

      if (req.query.budget === undefined) res.status(400).send("budget is needed");

      var budget:SingleRequest = JSON.parse(req.query.budget);
      let priceRange: number[] = [(budget.maxItems === 1)?budget.maxValue * 0.75:0, budget.maxValue]; 

      me.dal.getRecords(budget.cOK, budget.cKO, budget.pBad, priceRange, budget.maxItems, function(err:any, items:any[]) {
          let currValue:number = 0;
          let cartItems:MsCartItem[] = [];
          for(let i=0;i<items.length;i++)
            if ((currValue+items[i].price) <= budget.maxValue){
              cartItems.push(items[i]);
              currValue += items[i].price;
            }
          
          res.send(cartItems);
      }); // dal
    }); // get '/'
    this.app.use('/cart-items', router);
  } // routes

  public listen() {
    if (this.dal === undefined){
      console.log("ERROR: DAL not initialized. Use start() instead.");
      process.exit(1);
    }
    let port:number = process.env.PORT || 8080;
    this.app.listen(port);
    this.loadItemMainProps();
    console.log('http://127.0.0.1:' + port + '/cart-items');
  } // listen

  public start(){
    this.dal = new DAL("mongodb://localhost:27017/mybudget", 
      "items", 
      this);
  } // start

  itemsMainProps:any = [];
  loadItemMainProps() {
    console.log("Loading skues...");
    let srv = this;
    this.dal.getHeads([], ["sku","category","price","description"], true, 0, function(err:any, items:any[]) {      
        items.forEach((item)=>srv.itemsMainProps[item.sku]={"category":item.category, "price":item.price, "description":item.description});
        console.log(items.length, " skues loaded.");
        console.log(srv.createCompatibilityMatrix(srv.itemsMainProps)," comparisons done.");
    });
  } // loadItemMainProps

  public itemCM:any = {};
  public createCompatibilityMatrix(itemsMainProps:any[]): number {
    let stime = Date.now();
    var aSku = Object.keys(itemsMainProps)[0]; // sku={"category":item.category, "price":item.price, "description":item.description});
    console.log("-- creating Compatibility Matrix...", Date.now(), itemsMainProps.length, aSku);
    //var nItems = itemsMainProps.length;
    let j = 1;
    let n = 0;
    Object.keys(itemsMainProps[aSku]).forEach((prop)=>{ // serve x ciclare sulle property dell'item (category, description,price)
      console.log('> property:',prop, Date.now());
      Object.keys(itemsMainProps).forEach((item1sku)=>{
        let i = 1; 
        Object.keys(itemsMainProps).some((item2sku)=>{
          if (i>=j) return true;  
          n++;
          let res = this.isSimilar(prop, itemsMainProps[item1sku], itemsMainProps[item2sku]);
          if (res){
            if (!this.itemCM[item1sku]) this.itemCM[item1sku] = {};
            if (!this.itemCM[item1sku][prop]) this.itemCM[item1sku][prop] = [];
            //itemCM[item1sku].push(item2sku);
            this.itemCM[item1sku][prop].push(item2sku);
          }
          i++;
        });
        j++; 
      });
    });
    console.log('-- done:',Date.now(),(Date.now()-stime)/1000);
    return n;
  } // createCompatibilityMatrix

  public isSimilar(prop:any, item1:any, item2:any):boolean {
    // TODO: description comparison (via mongodb index???)
    try{
      let n1 = parseFloat(item1[prop]);
      let n2 = parseFloat(item2[prop]);
      
      if (!(isNaN(n1) || isNaN(n2))){       
        return (n1 >= (n2 *.95) && n1 <= (n2 * 1.05)); 
      }
    }catch(e){}
    return (item1[prop] == item2[prop]);  
  } // findSimilarity

} // class

