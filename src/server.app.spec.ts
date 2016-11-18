import {MsCartItem} from "./model/client/ms-cart-item";
import {MBServer} from "./server.app"


export class MBServerTest {
  readJSON():any{
    var jsonfile = require('jsonfile');
    return jsonfile.readFileSync("server/normalizers/files/cart-items-all.json");
  }


  loadFakeItems(){
      let itemsMainProps:any = [];

      itemsMainProps['sku1']={"category":"TV", "price":400.24, "description":"40 pollici LCD LED"};
      itemsMainProps['sku2']={"category":"TV", "price":120.24, "description":"40 pollici LCD LED"};
      itemsMainProps['sku3']={"category":"TV", "price":125.24, "description":"40 pollici LCD LED"};
      itemsMainProps['sku4']={"category":"Radio", "price":410.24, "description":"40 pollici LCD LED"};
      itemsMainProps['sku5']={"category":"Casa", "price":430.24, "description":"40 pollici LCD LED"};
      itemsMainProps['sku6']={"category":"Casa", "price":40.24, "description":"40 pollici LCD LED"};
      itemsMainProps['sku7']={"category":"TV", "price":40.24, "description":"40 pollici LCD LED"};
      itemsMainProps['sku8']={"category":"Cellulare", "price":340.24, "description":"40 pollici LCD LED"};
      itemsMainProps['sku9']={"category":"Casa", "price":121.24, "description":"40 pollici LCD LED"};
      itemsMainProps['sku10']={"category":"Cellulare", "price":410.14, "description":"40 pollici LCD LED"};

      return itemsMainProps;
  }
  
  testCompMatrix(){
    let  srv:MBServer;
    srv = new MBServer();
    
    srv.createCompatibilityMatrix(this.loadFakeItems());
    Object.keys(srv.itemCM).forEach((key:any)=>console.log(key, JSON.stringify(srv.itemCM[key].price)));
  } 

  testIsSimilar(){
    let  srv:MBServer;
    srv =new MBServer();
    let items = this.loadFakeItems();

    console.log('>expected:FALSE, ', srv.isSimilar('price',items['sku1'],items['sku2']));
    console.log('>expected:TRUE, ', srv.isSimilar('price',items['sku3'],items['sku2']));
    console.log('>expected:TRUE, ', srv.isSimilar('price',items['sku1'],items['sku4']));
    console.log('>expected:FALSE, ', srv.isSimilar('price',items['sku1'],items['sku8']));
  }

}

var test = new MBServerTest();
test.testIsSimilar();
test.testCompMatrix();
