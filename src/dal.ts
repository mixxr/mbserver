import * as mongodb from 'mongodb';

export class DAL<T>{
    mongoClient = mongodb.MongoClient;  
    _url = 'mongodb://localhost:27017/mybudget';
    _db:mongodb.Db;
    _collection:mongodb.Collection;

    constructor(url:string, coll:string, server:any){
        this._url = url;
        var obj = this;
        this.mongoClient.connect(url, function (err:any, db:any) {
                console.log("Connecting to server...",err);
                if (err) throw 'Error connecting to database - ' + err;

                obj._db = db;
                obj._collection = db.collection(coll);  

                server.listen();
        });
    }

    getRecords(categoriesOK:string[], categoriesBad:string[], skuToEsclude:string[], priceRange:number[], limit:number,callback:any){

        //var filter = {"category": {$in : categoriesOK, $nin : categoriesBad}, "sku" : {$nin : skuToEsclude}, "price" : {$gt : priceRange[0], $lt:priceRange[1]}};
        categoriesBad = categoriesBad || [];
        categoriesOK = categoriesOK || [];
        skuToEsclude = skuToEsclude || [];
        priceRange = priceRange || [];
        var filter = {};
        if (categoriesOK.length > 0 || categoriesBad.length > 0){
            filter["category"] = {};
            if (categoriesOK.length > 0)
                filter["category"].$in = categoriesOK;
            if (categoriesBad.length > 0)
                filter["category"].$nin = categoriesBad; 
        }
        if (skuToEsclude.length > 0){
            filter["sku"] = {};
            filter["sku"].$nin = skuToEsclude;
        }
        if (priceRange.length > 0){
            filter["price"] = {};
            filter["price"].$gt = priceRange[0];
            filter["price"].$lt = priceRange[1];
        }
        console.log(filter,JSON.stringify(filter));
        this._collection.find(filter).limit(limit).toArray( callback );
    }


    getHeads(skuToInclude:string[], cols:string[], noID: boolean, limit:number,callback:any){

        skuToInclude = skuToInclude || [];
        cols = cols || [];
        var filter = {}, 
            prj = {};

        if (skuToInclude.length > 0){
            filter["sku"] = {};
            filter["sku"].$in = skuToInclude;
        }
        if (noID) prj["_id"] = 0;
        cols.forEach((c)=>prj[c] = 1);

        this._collection.find(filter, prj).limit(limit).toArray( callback );
    }
}

