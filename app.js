const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");

var admin = require('firebase-admin');
const Transactions = require("./models/transactions");
const Customer = require("./models/customer");
const Length = require("./models/length");
const DebitCredit = require("./models/debitCredit");
const Reports = require("./models/reports");
const Lastiduseds = require("./models/lastIdUsed");
const Orders = require('./models/Orders');
// const LastCheckedIds = require('./models/lastCheckedIds')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var serviceAccount = require("./serviceAccountKey.json");
const { firestore } = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: "https://work-5bc8a.firebaseio.com"
});

var db = admin.firestore();
let customerLength ;
let idToUse ;
let lastIdUsedDate ;
let isInternet;
today = new Date();
if (String(today.getMonth()+1).length==1) {
  modiMonth= '0'+ String(today.getMonth()+1)
}
else{
  modiMonth =String(today.getMonth()+1)
}
if (String(today.getDate()).length==1) {
  modiDate= '0'+ String(today.getDate()+1)
}
else{
  modiDate =String(today.getDate())
}
// 
date= (String(today.getFullYear())+'-'+modiMonth+'-'+modiDate);
mongoose
  .connect(
    "mongodb+srv://damon:qwert123@cluster0.qyevd.mongodb.net/anilDeriyaJwellers?retryWrites=true", 
    {useNewUrlParser: true, useUnifiedTopology: true}
  )
  .then(() => {
    console.log("Connected to database!");
  })
  .catch(() => {
    console.log("Connection failed!");
  });

  app.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, PUT, DELETE, OPTIONS"
      );
      next();
  });
  
  //0
  app.post("/api/connectionChange", (req, res) => {
    console.log("online");
    let status= req.body.status;
    if (status == true) {
      this.isInternet=true;  
        check_Sync_Status();
        listenFCus();
       listenFOrders();
       check_Cus_Sync_Status();
        
    }
    else if(status == false){
      console.log("offline");
      this.isInternet=false;
      const unsubOrders = db.collection('orders').onSnapshot(() => {});
      unsubOrders();
      const unsubCus = db.collection('customers').onSnapshot(() => {});
      unsubCus();
      
    }
    res.status(201).json({
      message: 'read successfully'
    });

  });
  // 1
  app.post("/api/transactions", async(req, res) => {

    const transactions = new Transactions({
      _id:this.idToUse,//req.body._Id also gives id (hv to remove it)
      itemName: req.body.itemName,
      weight: req.body.weight,
      principle: req.body.principle,
      roi: req.body.roi,
      issueDate: date,
      cusId: req.body.cusId,
      returned:false

    });
    const transactionsF={
      _id:this.idToUse,//req.body._Id also gives id (hv to remove it)
      itemName: req.body.itemName,
      weight: req.body.weight,
      principle: req.body.principle,
      roi: req.body.roi,
      issueDate: date,
      cusId: req.body.cusId,
      returned:false

    }
    transactions.save();
    if (this.isInternet) {
      const res0 = await db.collection('transactions').doc(String(this.idToUse)).set(transactionsF);    
      const cityRef = db.collection('values').doc('values');
      const res1 = cityRef.update({today_transactions: this.idToUse});
    }
    Lastiduseds.updateOne( {_id:0} ,{$inc:{ID:1}},{upsert:true}).then(console.log("lastIdused updates"));
    res.status(201).json({
      message: 'Post added successfully'
    });
  });
  // 2
  app.post("/api/customer", async(req, res) => {
    const customer = new Customer({
      _id:this.customerLength,
      name: req.body.name,
      fname: req.body.fname,
      mobNum: req.body.mobNum,
      village: req.body.village,
      caste: req.body.caste,
      transactions:[]
    });
    customerF= {
      _id:this.customerLength,
      name: req.body.name,
      fname: req.body.fname,
      mobNum: req.body.mobNum,
      village: req.body.village,
      caste: req.body.caste,
      transactions:[]
    }
    customer.save();
    if (this.isInternet) {
         const res0 =  db.collection('customer').doc(String(this.customerLength)).set(customerF);
    }
 
    Length.updateOne( {_id:2} ,{$inc:{length:1}},{upsert:true}).then(console.log("customer last id updates"));

  });
  // 3
  app.post("/api/cusTran", (req, res) => { //find
    Customer.findOne({ _id: req.body.uid}).then(async(customer) => {
      customer.transactions.push( this.idToUse )
      if (this.isInternet) {
        const washingtonRef = db.collection('customer').doc(String(req.body.uid));
      const unionRes = await washingtonRef.update({
        transactions: admin.firestore.FieldValue.arrayUnion(String(this.idToUse))
      });
      }
      
      customer.save()
    });
    res.status(201).json({
      message: 'length updated successfully'
    });   
  });
  // 4
  app.post("/api/posts", (req, res) => {
    console.log(req.body);
    Arr=req.body
    if(Arr[0]=="rep"){

      Transactions.find( { $and:[{returnDate: {$gte:Arr[1]}},{returnDate:{$lte:Arr[2]}}] },{ "profit": 1,"returnDate":1,"cusId":1 } ).sort({returnDate:1}).then(documents => {
        res.status(200).json({
          transactions: documents
        });
      });
    }//
    else{
      let lesser = Arr[0];
      let greater= Arr[1];
      console.log(Arr[0],Arr[1]);
          Transactions.find({$and:[{issueDate: {$gte:Arr[0]}},{issueDate:{$lte:Arr[1]}}]}).then(documents=>{
            console.log(documents);
              res.status(200).json({
                transactions: documents
              });
            })
    }
    
  });
  // 5
  app.get("/api/lastIdUsed", (req, res) => {
    Lastiduseds.find().then(documents => {
      this.idToUse=documents[0].ID;
      console.log("lastIdUsed",this.idToUse);
      this.lastIdUsedDate = documents[0].date
      res.status(200).json({
        message: "Posts fetched successfully!",
        lastIdUsed: documents
      });
    });
  });
  // 6
  app.get("/api/reports", (req, res) => {
    Reports.find().then(documents => {
      res.status(200).json({
        message: "Posts fetched successfully!",
        Reports: documents
      });

    });
  });
  // 7
  app.post("/api/getCustomer", (req, res) => {
    Arr=req.body
    if (Arr.length==0) {
      Customer.find().then(documents => {
        res.status(200).json({
          message: "Posts fetched successfully!",
          customer: documents
        });
      });
    }
    else{
      Customer.find({_id:Arr[0]}).then(documents => {
        res.status(200).json({
          message: "Posts fetched successfully!",
          customer: documents
        });
        
      });
    }
    
  });
  // 8
  app.post("/api/getdebitCredit", (req, res) => {
    // console.log(req.body[0],req.body[1]);
    if (req.body.length==2) {
          DebitCredit.find({$and:[{date: {$gte:req.body[0]}},{date:{$lte:req.body[1]}}]}).then(documents=>{
            // console.log(documents);
              res.status(200).json({
                message: "Posts fetched successfully!",
                debitCredit: documents
              });            
            })
        
    } else {
      DebitCredit.find().then(documents => {
        res.status(200).json({
          message: "Posts fetched successfully!",
          debitCredit: documents
        });
        
      });
    }
 
  });
  // 9
  app.post("/api/rtd", (req, res) => {
    if (req.body == []) {
      Transactions.find().then(documents => {
        res.status(200).json({
          message: "returnedTransaction successfully!",
          returnedTransaction: documents
        });
        
      });
    }
    else if(req.body[0]=="com.R"){
            Transactions.find({$and:[{returnDate: {$gte:req.body[1]}},{returnDate:{$lte:req.body[2]}}]}).then(documents=>{
              console.log(documents);
                res.status(200).json({
                  returnedTransaction: documents
                });
              })
    }

  });
  // 10
  app.get("/api/length", (req, res) => {
    Length.find().then(documents => {
      res.status(200).json({
        message: "Posts fetched successfully!",
        length: documents
      });
      this.customerLength = documents[0].length;

    });


  });
  // 11
  app.post("/api/indiTrans", (req, res) => {
    
    Transactions.find({'_id' : req.body }).then(transactions => {
          res.status(200).json({
            message: "Posts fetched successfully!",
            transactions : transactions
          });
        });
  });
  // 12
  app.post("/api/return", async(req, res) => {
    if (this.isInternet) {
      const cityRef  =  db.collection('transactions').doc(String(req.body._id));
      const res0 =  cityRef.update({profit:req.body.profit,returnDate:date});
      const cityRef1 = db.collection('values').doc('values');
      const res1 =  cityRef1.update({today_transactions: this.idToUse});
    }
    Lastiduseds.updateOne( {_id:0} ,{$inc:{ID:1}},{upsert:true}).then(console.log("lastIdused updates return"));
    Transactions.findOneAndUpdate({ _id: req.body._id},{$set:{profit:req.body.profit,returnDate:date}})
    .then(transactions => {
    });
   res.status(201).json({
    message: 'return updated successfully'
  });
  })
  // 13
  app.post("/api/debitCredit", async(req, res) => { 
    const debitCredit = new DebitCredit({
      _id:this.idToUse,
      amount: req.body.amount,
      date: date,
      description: req.body.description,
    });
    dc={
      _id:this.idToUse,
      amount: req.body.amount,
      date: date,
      description: req.body.description,
    }
    debitCredit.save();
    if (this.isInternet) {
        const res0 =  db.collection('debitCredit').doc(String(this.idToUse)).set(dc);
        const cityRef = db.collection('values').doc('values');
        const res1 =  cityRef.update({today_transactions: this.idToUse});
    }
    Lastiduseds.updateOne( {_id:0} ,{$inc:{ID:1}},{upsert:true}).then(console.log("lastIdused updates return"));
    res.status(201).json({
      message: 'Post added successfully'
    });
  })
  // 14
  app.post("/api/mainBal", async(req, res) => { 
    if (this.isInternet) {
     const cityRef  =  db.collection('values').doc('values');
     const res0 = await cityRef.update({base_bal:req.body[6]});
    }

    Reports.updateOne( {_id:1} ,{$set:{transactions:req.body}},{upsert:true}).then(result => {
    });
    res.status(201).json({
      message: 'Post added successfully'
    });
  })
  // 15
  app.post("/api/addToReports", async(req, res) => { 
    if (this.isInternet) {
      const cityRef  =  db.collection('values').doc('values');
      const res0 = cityRef.update({base_bal:req.body[6]});
    }

    Reports.updateOne( {_id:1} ,{$set:{transactions:req.body}},{upsert:true}).then(console.log("done"))
    res.status(201).json({
      message: 'profit added successfully'
    });
  })
  //16
  app.post("/api/orders", (req, res) => {// finds order
    // console.log(req.body[0],req.body[1]);

    Orders.find({$and:[{date: {$gte:req.body[0]}},{date:{$lte:req.body[1]}}]}).sort({_id:1}).then(documents => {
      // console.log(documents);
      res.status(200).json({
        message: "Posts fetched successfully!",
        orders: documents
      });
    });

  });
  //17
  app.post("/api/postOrders", (req, res) => { //one() will store mainBal because the date is changed  two() does not stores date
    // let tdate='';
    let main_bal;
    let id =this.idToUse;
    console.log("this.idToUse",this.idToUse, "post orders");

    // first().then(()=> {
      if (this.lastIdUsedDate!=this.date) {
        One();
      }
      else{
        Two();
      }
  
    function One(){
      inOne().then(()=> {inTwo()})
      function inOne() {
  
        return promise2 = new Promise((res,rej)=>{
        Reports.find().then(document=>{
          main_bal=document[0].transactions[6]
          console.log(main_bal);
          res();
        })
       })
      }
    async function inTwo() {
  
        const order = new Orders({
          _id:Number(id),//
          date:date,
          T:req.body.T,
          main_bal:main_bal
        });
        
        const cityRef = db.collection('values').doc('values');
        Lastiduseds.findOneAndUpdate({ _id:0},{$set:{date:date}}).then(console.log(date))
          if (this.isInternet) {
             const res0 = cityRef.update({date: date});
             const res1 = db.collection('type_of_transaction').doc(String(id)).set(order);
          }
        order.save();
    }
    }
    async function Two() {
      console.log("id" , id);
      const order = new Orders({
        _id:Number(id),//req.body._Id also gives id (hv to remove it)
        date:this.date,
        T:req.body.T
      });
     const orderF = {
      _id:Number(id),//req.body._Id also gives id (hv to remove it)
      date:this.date,
      T:req.body.T
     }
      if (this.isInternet) {
         const res0 = db.collection('type_of_transaction').doc(String(id)).set(orderF);
      }

    order.save();
  
    }
  
  });
  //18
  app.get("/api/newTrId", (req, res) => { // after adding new tr, to add tr-id into cus-Tr arr without reloading
      res.status(200).json({
        Id: this.idToUse,
    });
  });
  //19
  function listenFCus() { //listen firebase customer
    const doc = db.collection('customer').orderBy("_id","desc").limit(1);
    const observer = doc.onSnapshot(docSnapshot => {
      docSnapshot.forEach(doc => {
        Customer.aggregate([{$sort:{_id:-1}},{$limit:1}]).then(documents => {
          if (documents == null || [] || undefined) {
            if (Number(doc.data()._id)>-1) {
              syncCus(Number(doc.data()._id)+1);
            }
          }
          else if (documents[0]._id!=Number(doc.data()._id)) {
            syncCus(Number(doc.data()._id)-documents[0]._id);
          }
        })
    }); 
    }, err => {
      console.log(`Encountered error: ${err}`);
    });
  }
 //20
  async function syncCus(diff) {
      let  promise = new Promise(async(res,rej) => {
          let cusArray =[];
          const query = db.collection('customer').orderBy("_id","desc").limit(diff);
          const snapshot = await query.get();
          snapshot.forEach(doc => {
          console.log("doc.data() customer",doc.data());
            cusArray.push(doc.data())
      });
      res(cusArray);
    });
  let result = await promise;
  // console.log("result",result);
    Customer.insertMany(result).then(function(){ 
      console.log("Customer inserted")  // Success 
      Length.updateOne( {_id:2} ,{$inc:{length:Number(diff)}},{upsert:true}).then(console.log("L"))
  }).catch(function(error){ 

      console.log("error",error)      // Failure 
  }); 


  }

   function listenFOrders() {
    console.log("1");
    const doc = db.collection('type_of_transaction').orderBy("_id","desc").limit(1);
    const observer = doc.onSnapshot(docSnapshot => {
      // console.log(docSnapshot);
      docSnapshot.forEach(doc => {
        Lastiduseds.findOne({_id:0}).then(documents => {
            diff = (Number(doc.data()._id)+1)-documents.ID;
            if(diff>0){
              syncFtoL(String(diff))
          }
        })
    }); 
    }, err => {
      console.log(`Encountered error: ${err}`);
    });
  }
// LastCheckedIds
  async function syncFtoL(diff) {
    console.log("diff",diff);
    let tranCount=0;
    let dcCount=0 ;
    let rtransCount=0 ;

      const citiesRef = db.collection('type_of_transaction');
      const snapshot = await citiesRef.orderBy('_id','desc').limit(Number(diff)).get();
    Orders.insertMany(snapshot.docs.map(doc => doc.data())).then(console.log("orders inserted"));
    Lastiduseds.updateOne( {_id:0} ,{$inc:{ID:Number(diff)}},{upsert:true}).then(console.log("Lastiduseds"));
      snapshot.forEach(doc => {
        // console.log(doc.data());
        switch (doc.data().T) {
          case 'DC'://dc
          dcCount++
            break;
          case 'R'://r
          rtransCount++
            break;
          case 'T'://t
          tranCount++
            break;
        }
      });
    console.log(tranCount,dcCount,rtransCount);
    if (tranCount!=0) {
      then_sync_Tran_F_to_L(tranCount);
      console.log("tranCount",tranCount);
    }
    if (dcCount!=0) {
      then_sync_DC_F_to_L(dcCount-1);
    }
    if (rtransCount!=0) {
      then_sync_RTran_F_to_L(rtransCount-1);
    }
  } 
  // then_sync_Tran_F_to_L(1);
  async function then_sync_Tran_F_to_L(len) {
    const citiesRef = db.collection('transactions');
    const snapshot = await citiesRef.orderBy('_id','desc').limit(Number(len)).get();
    console.log(snapshot.docs.map(doc => doc.data()));
    Transactions.insertMany(snapshot.docs.map(doc => doc.data())).then(console.log("Transactions inserted"))
    snapshot.forEach(doc => {
      Customer.findOne({_id:Number(doc.data().cusId)}).then((customer)=>{
        if(customer!=null){
          if (customer.transactions.includes(doc.data()._id)) {
          console.log("in if");
        }
        else if (customer != undefined ){
          customer.transactions.push(doc.data()._id)
          console.log(customer);
          const customers = new Customer(customer);
          customers.save().then(console.log("done"));
          console.log("in then_sync_Tran_F_to_L in forEach in customer find one in for in else");
        }
      }
      })
      
    });
  }
  async function then_sync_DC_F_to_L(len) {
    const citiesRef = db.collection('debitCredit');
    const snapshot = await citiesRef.orderBy('_id','desc').limit(Number(len)).get();
    DebitCredit.insertMany(snapshot.docs.map(doc => doc.data())).then(console.log("DB inserted"));

  }
  async function then_sync_RTran_F_to_L(len) {
    console.log(len);
    let oppArray =[];
    const citiesRef = db.collection('transactions');
    const snapshot = await citiesRef.orderBy('rid','desc').limit(Number(len)).get();
    // console.log(snapshot.docs.map(doc => doc.data()));

    snapshot.forEach(doc => {
      console.log(doc);
      oppArray.push({updateOne: {
        filter: { _id: doc.data()._id },
        update: { profit:doc.data().profit, returnDate: doc.data().returnDate, returned: doc.data().returned}
      }});
    });
    Transactions.bulkWrite(oppArray);
    
  }

  function check_Sync_Status(){
    let localid;
    let firestoreid;

    const promise1 = new Promise(async(res,rej) => {
      const doc = await db.collection('values').doc('values').get();
     if (doc.exists){
        console.log('Document data:', doc.data().today_transactions);
        firestoreid= doc.data().today_transactions;
        res();
      }       
      
    })
    const promise2 = new Promise((res,rej) => {
      Lastiduseds.findOne({_id:0}).then(document => {
        console.log(document);
        localid = document.ID;
        res();
      })
     
    }) 
    Promise.all([promise1,promise2]).then(()=>{
      console.log("T",localid,Number(firestoreid));

     if (localid>Number(firestoreid)) {
      syncLtoF(localid-Number(firestoreid));
     }
    })

  }

   function syncLtoF(diff){
    let tranCount=0;
    let dcCount=0 ;
    let rtransCount=0 ;
    Orders.aggregate([{$sort:{_id:-1}},{$limit:Number(diff)}]).then(async(documents)=> {
      console.log(documents);
      const batch = db.batch();
      for (let i = 0; i < documents.length; i++) {
        const nycRef = db.collection('type_of_transaction').doc(String(documents[i]._id));
        batch.set(nycRef, documents[i]);
        switch (documents[i].T) {
          case 'DC'://dc
          dcCount++
            break;
          case 'R'://r
          rtransCount++
            break;
          case 'T'://t
          tranCount++
            break;
        }
      }
      batch.commit();
      const cityRef = db.collection('values').doc('values');
      const res1 = cityRef.update({date: date,today_transactions:admin.firestore.FieldValue.increment(diff) });
      if (tranCount!=0) {
        then_sync_Tran_L_to_F(tranCount);
      }
      if (dcCount!=0) {
        then_sync_DC_L_to_F(dcCount);
      }
      if (rtransCount!=0) {
        then_sync_RTran_L_to_F(rtransCount);
      }
    })
  }

  function then_sync_Tran_L_to_F(len) {
    console.log("then_sync_Tran_L_to_F len",len);
    Transactions.aggregate([{$sort:{_id:-1}},{$limit:Number(len)}]).then(documents =>{
    const batch1 = db.batch();
      for (let i = 0; i < documents.length; i++) {
        const Trs = db.collection('transactions').doc(String(documents[i]._id));
        batch1.set(Trs, documents[i]);
      }
     batch1.commit();

    })

  }
  function then_sync_DC_L_to_F(len) {
    const batch = db.batch();

    DebitCredit.aggregate([{$sort:{_id:-1}},{$limit:Number(len)}]).then(documents =>{
      for (let i = 0; i < documents.length; i++) {
        const nycRef = db.collection('debitCredit').doc(String(documents[i]._id));
        batch.set(nycRef, documents[i]);
      }
    })
     batch.commit();

  }
  function then_sync_RTran_L_to_F(len) {
    const batch = db.batch();

    Transactions.aggregate([{$sort:{rid:-1}},{$limit:Number(len)}]).then(documents =>{
      for (let i = 0; i < documents.length; i++) {
        const nycRef = db.collection('transactions').doc(String(documents[i]._id));
        batch.set(nycRef, documents[i]);
      }
    })
     batch.commit();

  }
  function check_Cus_Sync_Status() {
    let localid;
    let firestoreid;

    const promise1 = new Promise(async(res,rej) => {
      const citiesRef = db.collection('customer').limit(1);
      const snapshot = await citiesRef.orderBy('_id','desc').get();    
      snapshot.forEach(doc => {
        firestoreid= Number(doc.data()._id)+1
        res();
      });
    })
    const promise2 = new Promise((res,rej) => {
      Length.findOne({_id:2}).then(document => {
        localid = document.length;
        res();
      })
    }) 

    Promise.all([promise1,promise2]).then(()=>{
      console.log("localid-firestoreid",localid,firestoreid);
      if (localid>firestoreid) {
        let diff = Number(localid)-Number(firestoreid)
        Customer.aggregate([{$sort:{_id:-1}},{$limit:Number(diff)}]).then(documents=> {
          const batch = db.batch();
          for (let i = 0; i < documents.length; i++) {
           console.log(documents[i]._id);
            const nycRef = db.collection('customer').doc(`${documents[i]._id}`);
            batch.set(nycRef, documents[0]);
            
          }
          batch.commit();
    
        })
       
      }
     })  
  }



















module.exports = app;

