var connection = require('../database').connection;
var express = require('express');
var router = express.Router();
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , static = require('serve-static')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , path = require('path')
  ,  sha1 = require('sha1');
var sql_enak = require('../database/mysql_enak.js').connection;
var cek_login = require('./login').cek_login;
var cek_login_google = require('./login').cek_login_google;
var dbgeo = require("dbgeo");
var multer = require("multer");
var st = require('knex-postgis')(sql_enak);
const importExcel = require("convert-excel-to-json");
const { count } = require('console');
const { log } = require('async');

path.join(__dirname, '/public/foto')
  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));

  router.use(cookieParser() );
  router.use(passport.initialize());
  router.use(passport.session());
  router.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/foto/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now()+'-'+file.originalname)
  }
})

var upload = multer({ storage: storage })

//start-------------------------------------
router.post('/data', upload.fields([{ name: 'excel', maxCount: 1 }]), async function(req, res){
  let {tahun} = req.body  
  console.log(tahun);
  
  let str = ''
  let v = []
  if (tahun) {
    str = `and tahun = ?`
    v.push(tahun)
    try {
    if (req.files) {
      if (req.files['excel']) {
        let file = req.files.excel[0];
        let hasil = await importExcel({
          sourceFile: file.path,
          header: { rows: 1 },	
          columnToKey:{  A:"kecamatan",B:"kelurahan",C :"EOS", D:"name", E:"description",  F:"category", G:"lon",
            H :"lat", 
            I:"EOG", J:"volume", K:"satuan", L:"anggaran"
            ,M :"tahun", N:"asal_usulan"
            ,O:"jenis_usulan"
            // ,P:"usulan",Q:"id_kec",R:"id_kel"
          },
          
          // sheets: [`Batch example Newrenbang 2025`],

          sheets: [`Sheet1`],
        });	
        // let result = hasil[`Batch example Newrenbang 2025`]
        let result = hasil[`Sheet1`]

   
        await sql_enak.raw(`UPDATE data
SET  deletedAt=CURRENT_DATE() 
WHERE data_id>0 ${str}`,v)
        for (let i = 0; i < result.length; i++) {    
          // result[i].tahun_anggaran = req.body.tahun_anggaran
          const input = result[i].name

          // Memisahkan string menjadi array berdasarkan kata terakhir "Usulan"
          // const splitIndex = input.lastIndexOf("Usulan");
          // const split_text = [
          //   input.substring(0, splitIndex).trim(),
          //   input.substring(splitIndex).trim()
          // ];
          // result[i].alamat = split_text[0]
          // result[i].usulan = split_text[1]
          result[i].insertedAt = new Date()
          result[i].lastUpdateAt = new Date()
          // result[i].jenis_usulan = null
          // const text = split_text[1].toLowerCase()
          const text = input
const search1 = ['beton', 'aspal', 'paving', 'jalan', 'peninggian']
const search2 = ['saluran', 'got', 'gorong', 'drainase']
const search3 = ['talud','bronjong']
// for (let k = 0; k < search1.length; k++) {
//   if (text.includes(search1[k].toLowerCase())) {

//     result[i].jenis_usulan ='Jalan'
//   }
// }
// for (let k = 0; k < search2.length; k++) {
//   if (text.includes(search2[k].toLowerCase())) {

//     result[i].jenis_usulan ='Saluran'
//   }
// }
// for (let k = 0; k < search3.length; k++) {
//   if (text.includes(search3[k].toLowerCase())) {
 
//     result[i].jenis_usulan ='Talud'
//   }
// }
          let id_kec_kel = await sql_enak.raw(`SELECT id_kecamatan,id_kelurahan
FROM kecamatan k 
LEFT JOIN kelurahan k2 on k2.id_kec = k.id_kec 
where REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(?, 'A', ''), 'I', ''), 'U', ''), 'E', ''), 'O', ''), ' ', '') = 
REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(k.kecamatan, 'A', ''), 'I', ''), 'U', ''), 'E', ''), 'O', ''), ' ', '') and  
REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(?, 'A', ''), 'I', ''), 'U', ''), 'E', ''), 'O', ''), ' ', '') = 
REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(k2.desa, 'A', ''), 'I', ''), 'U', ''), 'E', ''), 'O', ''), ' ', '')`,[result[i].kecamatan,result[i].kelurahan]) 
console.log([id_kec_kel,result[i].kecamatan,result[i].kelurahan]);

result[i].id_kec = id_kec_kel[0][0].id_kecamatan
result[i].id_kel = id_kec_kel[0][0].id_kelurahan        
}
        await sql_enak.insert(result).into("data").then(async function (hsl) {
          await sql_enak('data').whereNotNull('deletedAt').del();
          res.json('Sukses')
        }).catch(async function (err) {
          console.log(err);
          res.json(err)
        })
      }else{
        res.json('file salah')
      }
  }else{
    res.json('error')
  }
    } catch (error) {
    console.log(error);
    // Handle the error appropriately
    // res.status(500).send('Internal Server Error');
    }
  } else{
        res.status(500).send('Tahun Wajib DI isi');

  }

  })
module.exports = router;
