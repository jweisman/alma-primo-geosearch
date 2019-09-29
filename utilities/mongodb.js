const mongoClient = require('mongodb').MongoClient;

class MongoClient {
  constructor(url, collection) {
    return new Promise( (resolve, reject) => {
      mongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, 
        (err, client) => {
        if(err) reject(err);
        else {
          this.client = client;
          this.db = client.db();
          this.collection = collection;
          resolve(this);
        }
      });
    }); 
  }

  insertMany(objects, { collection=this.collection } = {} ) {
    return new Promise( (resolve, reject) => {
      this.db.collection(collection).insertMany(objects, function(err, result) {
        if (err) reject(err);
        else resolve(result);
        });    
    });  
  }

  deleteMany(query, { collection=this.collection } = {} ) {
    return new Promise( (resolve, reject) => {
      this.db.collection(collection).deleteMany(query, function(err, result) {
        if (err) reject(err);
        else resolve(result);
        });    
    });  
  }

  find(query, { collection=this.collection } = {} ) {
    return new Promise( (resolve, reject) => {
      this.db.collection(collection).find(query).toArray(function(err, docs) {
        if (err) reject(err);
        else resolve(docs);
      });
    });
  }

  findOneAndUpdate(query, update, { collection=this.collection } = {} ) {
    return new Promise( (resolve, reject) => {
      this.db.collection(collection).findOneAndUpdate(query, update, { returnNewDocument: true, upsert: true },
        function(err, doc) {
        if (err) reject(err);
        else resolve(doc.value);
      });
    });
  }  

  findOne(query, { collection=this.collection } = {} ) {
    return new Promise( (resolve, reject) => {
      this.db.collection(collection).findOne(query, function(err, doc) {
        if (err) reject(err);
        else resolve(doc);
      });
    });
  } 

  close() {
    this.client.close();
  }
}

module.exports = MongoClient;