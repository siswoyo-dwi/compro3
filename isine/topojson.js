var connection = require('../database').connection;
var express = require('express');
var router = express.Router();
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , static = require('serve-static')
  , bodyParser = require('body-parser')
  , session = require('express-session')
  , cookieParser = require('cookie-parser');
 var cek_login = require('./login').cek_login;
var dbgeo = require("dbgeo");
var sql_enak = require('../database/mysql_enak.js').connection;


  router.use(bodyParser.urlencoded({ extended: true }));
  router.use(bodyParser.json());
  router.use(cookieParser() );
  router.use(session({ secret: 'bhagasitukeren', cookie: { maxAge : 1200000 },saveUninitialized: true, resave: true }));
  router.use(passport.initialize());
  router.use(passport.session());
  var st = require('knex-postgis')(sql_enak);

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});



      router.get('/json_kec', function(req, res){
  //connection.connect();
  //console.log(req.query)
  connection.query("SELECT x(centroid(a.the_geom)) as x, y(centroid(a.the_geom)) as y, a.nama_kecamatan as kec FROM master_kecamatan a" , function(err, rows, fields) {
    if (err) throw err;

   //console.log("SELECT asWkt(admin_kec.the_geom) as geometry FROM admin_kec WHERE MBRContains(GeomFromText( 'POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))' ),admin_kec.the_geom");

  //res.end(JSON.stringify(rows))

    // MySQL query...
  //ambil geojson
  res.send(JSON.stringify(rows))
  });

  //connection.end();
  })
  router.get('/detail_jembatan/:id',async function(req, res){
   let data = await sql_enak.raw(`SELECT *, x(centroid(mj.SHAPE)) as x, y(centroid(mj.SHAPE)) as y,asWkt(SHAPE) as geometry FROM master_jembatan mj left join data_umum du on du.master_jembatan_id =mj.master_jembatan_id 
 WHERE  mj.master_jembatan_id = ?  and mj.SHAPE is not null `,[req.params.id])
    // MySQL query...
  //ambil geojson
    dbgeo.parse({
    "data": data[0],
    "outputFormat": "topojson",
    "geometryColumn": "geometry",
    "geometryType": "wkt"
  },function(error, result) {
    if (error) {
      return console.log(error);
    }
    // This will log a valid GeoJSON object
   // console.log(result)  
    res.send(JSON.stringify(result))
  }); 
  })
   router.get('/topojson_kec', function(req, res){
 //connection.connect();
 //console.log(req.query)
 if(req.query.id_kec){
   var tambahan = "where id_kec= '"+req.query.id_kec+"'";
 }else{
   var tambahan = "";
     
 }
 connection.query("SELECT asWkt(the_geom) as geometry,  nama_kec as kabupaten FROM kecamatan "+tambahan, function(err, rows, fields) {
   if (err) throw err;

  //console.log("SELECT asWkt(admin_kec.the_geom) as geometry FROM admin_kec WHERE MBRContains(GeomFromText( 'POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))' ),admin_kec.the_geom");

 //res.end(JSON.stringify(rows))

   // MySQL query...
 //ambil geojson
   dbgeo.parse({
   "data": rows,
   "outputFormat": "topojson",
   "geometryColumn": "geometry",
   "geometryType": "wkt"
 },function(error, result) {
   if (error) {
     return console.log(error);
   }
   // This will log a valid GeoJSON object
  // console.log(result)  
   res.send(JSON.stringify(result))
 });
 });

 //connection.end();
 })

   router.get('/topojson_desa', function(req, res){
//connection.connect();
//console.log(req.query)
connection.query("SELECT asWkt(a.the_geom) as geometry, a.nama_kelurahan as desa, a.id_kelurahan FROM master_kelurahan a  WHERE mbrIntersects(a.the_geom,  GeomFromText('POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))', 1))", function(err, rows, fields) {
  if (err) throw err;

 //console.log("SELECT asWkt(admin_kec.the_geom) as geometry FROM admin_kec WHERE MBRContains(GeomFromText( 'POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))' ),admin_kec.the_geom");

//res.end(JSON.stringify(rows))

  // MySQL query...
//ambil geojson
  dbgeo.parse({
  "data": rows,
  "outputFormat": "topojson",
  "geometryColumn": "geometry",
  "geometryType": "wkt"
},function(error, result) {
  if (error) {
    return console.log(error);
  }
  // This will log a valid GeoJSON object
 // console.log(result)  
  res.send(JSON.stringify(result))
});
});

//connection.end();
})
 // router.get('/bencana', function(req, res){
 // //connection.connect();
 // //console.log(req.query)
 // var tambahan = "where deleted=0";
 // if(req.query.id_kec){
 //    tambahan = tambahan+" and id_desa= '"+req.query.id_kec+"'";
 // }
 // connection.query("SELECT asWkt(a.SHAPE) as geometry, id  FROM angin_puting_beliung_dan_hujan_deras a "+tambahan, function(err, rows, fields) {
 //   if (err) throw err;

 //  //console.log("SELECT asWkt(admin_kec.the_geom) as geometry FROM admin_kec WHERE MBRContains(GeomFromText( 'POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))' ),admin_kec.the_geom");

 // //res.end(JSON.stringify(rows))

 //   // MySQL query...
 // //ambil geojson
 //   dbgeo.parse({
 //   "data": rows,
 //   "outputFormat": "topojson",
 //   "geometryColumn": "geometry",
 //   "geometryType": "wkt"
 // },function(error, result) {
 //   if (error) {
 //     return console.log(error);
 //   }
 //   // This will log a valid GeoJSON object
 //  // console.log(result)  
 //   res.send(JSON.stringify(result))
 // });
 // });

 // //connection.end();
 // })

 router.get('/pola_ruang', function(req, res){
 //connection.connect();
 //console.log(req.query)
 var tambahan = "";
 if(req.query.id_kab){
    tambahan += " and prs.kdpkab= '"+req.query.id_kab+"'";
 }
 if (req.query.s) {
  tambahan += ` and ST_Intersects(SHAPE,GeomFromText('${req.query.s}', 1)) `
 }
 console.log(tambahan);
 
 connection.query("SELECT asWkt(prs.SHAPE) as geometry, `namobj`, `kdpkab`, wpr.hex as waarna FROM `pola_ruang_sample` prs join warna_pola_ruang wpr on prs.namobj = wpr.ket_warna WHERE 1 "+tambahan, function(err, rows, fields) {
   if (err) throw err;

  //console.log("SELECT asWkt(admin_kec.the_geom) as geometry FROM admin_kec WHERE MBRContains(GeomFromText( 'POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))' ),admin_kec.the_geom");

 //res.end(JSON.stringify(rows))

   // MySQL query...
 //ambil geojson
   dbgeo.parse({
   "data": rows,
   "outputFormat": "topojson",
   "geometryColumn": "geometry",
   "geometryType": "wkt"
 },function(error, result) {
   if (error) {
     return console.log(error);
   }
   // This will log a valid GeoJSON object
  // console.log(result)  
   res.send(JSON.stringify(result))
 });
 });


 //connection.end();
 })
 router.get('/jalan',async function(req, res){
  var tambahan = "";
  let value = []
if (req.query.id_jalan) {
  tambahan+=' and j.kd_ruas = ?'
  value.push(req.query.id_jalan)
}
 let r = await sql_enak.raw(`SELECT  asWkt(j.SHAPE) as geometry , status FROM jalan j   WHERE j.deletedAt is null and j.SHAPE is not null ${tambahan}`,value)
 let rows = r[0]
    dbgeo.parse({
    "data": rows,
    "outputFormat": "topojson",
    "geometryColumn": "geometry",
    "geometryType": "wkt"
  },function(error, result) {
    if (error) {
      return console.log(error);
    }
    res.send(JSON.stringify(result))
  });
  })
  router.get('/segmen',async function(req, res){
    var tambahan = "";
    let value = []
  if (req.query.data_id) {
    tambahan+=' and s.data_id = ?'
    value.push(req.query.data_id)
  }
  if (req.query.segmen_id) {
    tambahan+=' and s.segmen_id = ?'
    value.push(req.query.segmen_id)
  }
  if (req.query.id_kec) {
    tambahan+=' and d.id_kec = ?'
    value.push(req.query.id_kec)
  }
  if (req.query.id_kel) {
    tambahan+=' and d.id_kel = ?'
    value.push(req.query.id_kel)
  }
  if (req.query.arr_tahun) {
    let a = req.query.arr_tahun.split(',')
    tambahan+=' and (' 
    for (let i = 0; i < a.length; i++) {
      if (i>0) {
        tambahan+=' or '
      }
      tambahan+=' d.tahun = ?'
      value.push(a[i])
    }
    tambahan+=' ) ' 
  }
  if (req.query.arr_jenisUsulan) {
    let a = req.query.arr_jenisUsulan.split(',')
    tambahan+=' and (' 
    for (let i = 0; i < a.length; i++) {
      if (i>0) {
        tambahan+=' or '
      }
      tambahan+=' d.jenis_usulan = ?'
      value.push(a[i])
    }
    tambahan+=' ) ' 

  }
   let r = await sql_enak.raw(`SELECT  asWkt(s.SHAPE) as geometry ,d.name , d.anggaran , d.id_kec , d.id_kel , d.jenis_usulan , d.tahun   FROM segmen s left join data d on d.data_id = s.data_id  WHERE d.deletedAt is NULL and s.deletedAt is null and s.SHAPE is not null ${tambahan}`,value)
   let rows = r[0]
      dbgeo.parse({
      "data": rows,
      "outputFormat": "topojson",
      "geometryColumn": "geometry",
      "geometryType": "wkt"
    },function(error, result) {
      if (error) {
        return console.log(error);
      }
      res.send(JSON.stringify(result))
    });
    })
 router.get('/jembatan',async function(req, res){
  var tambahan = "";
  let value = []
if (req.query.master_jembatan_id) {
  tambahan+=' and mj.master_jembatan_id = ?'
  value.push(req.query.master_jembatan_id)
}
if (req.query.id_jalan) {
  tambahan+=' and mj.id_jalan = ?'
  value.push(req.query.id_jalan)
}
 let r = await sql_enak.raw(`SELECT mj.nama_sungai,nama_jembatan,tipe_lintasan, asWkt(mj.SHAPE) as geometry, mj.master_jembatan_id FROM master_jembatan mj left join data_umum du on du.master_jembatan_id =mj.master_jembatan_id   WHERE mj.deletedAt is null and mj.SHAPE is not null ${tambahan}`,value)
 let rows = r[0]
    dbgeo.parse({
    "data": rows,
    "outputFormat": "topojson",
    "geometryColumn": "geometry",
    "geometryType": "wkt"
  },function(error, result) {
    if (error) {
      return console.log(error);
    }
    res.send(JSON.stringify(result))
  });
  })
           router.get('/list_polaruang', function(req, res){
    //connection.connect();
   // console.log(req.query.kode_kab)
    var a = '';
    if(req.query.x != undefined && req.query.y != undefined){
      a = "where ST_Within(GeomFromText('POINT("+req.query.x+" "+req.query.y+")'),a.SHAPE);";
    }else if(req.query.p != undefined){
      a = "where ST_Intersects(a.SHAPE, GeomFromText('"+req.query.p+"'));";
    }
    connection.query("SELECT distinct(a.SHAPE) as rencana_tg, a.namobj as kode FROM pola_ruang_sample a "+a , function(err, rows, fields) {
      if (err) throw err;

      res.send(JSON.stringify(rows))
    });
    //connection.end();
    })

    
    router.get('/kabupaten', function(req, res){
      //connection.connect();
     // console.log(req.query.kode_kab)
      var a = '';
   
      connection.query("SELECT x(ST_Centroid(SHAPE)) as xe ,y(ST_Centroid(SHAPE)) as ye, kdpkab, wadmkk  FROM `kabupaten_kota` WHERE 1 "+a , function(err, rows, fields) {
        if (err) throw err;
  
        res.send(JSON.stringify(rows))
      });
      //connection.end();
      })
      router.get('/get_administrasi',async function(req, res){
        //connection.connect();
       // console.log(req.query.kode_kab)
        var a = '';
        let count = await sql_enak.raw("SELECT wadmkk   FROM `kabupaten_kota` WHERE 1 and  ST_Intersects(SHAPE,GeomFromText(?, 1)) "+a ,[req.query.wkt])
        console.log([count[0],1]);
        
      let rows = await sql_enak.raw("SELECT kdpkab, wadmkk as kabupaten ,judul_rencana_tata_ruang , tahun_legalisir_RTR , nomor_peraturan_RTR FROM `kabupaten_kota` WHERE 1 and  ST_Contains(SHAPE,ST_Centroid(GeomFromText(?, 1))) "+a ,[req.query.wkt])
          // if (err) throw err;
          console.log([rows[0],2]);

      let rowss =  await   sql_enak.raw("SELECT wadmkd, wadmkc, kdpkab, kdcpum, kdepum  FROM `desa_kelurahan` WHERE 1 and  ST_Contains(SHAPE,ST_Centroid(GeomFromText(?, 1))) "+a ,[req.query.wkt])
      console.log([rowss[0],3]);

      let rowsss =  await   sql_enak.raw("SELECT namobj FROM `pola_ruang_sample` WHERE 1 and  ST_Contains(SHAPE,ST_Centroid(GeomFromText(?, 1))) "+a ,[req.query.wkt])
      console.log([rowsss[0],4]);

      let das =  await   sql_enak.raw("SELECT nama_das FROM `das` WHERE 1 and  ST_Contains(SHAPE,ST_Centroid(GeomFromText(?, 1))) "+a ,[req.query.wkt])
      // if (errr) throw errr;
      console.log([das[0],5]);

            if (rowss[0].length > 0) {
              rows[0][0].status_lintas_kab = count[0].length
              rows[0][0].lintas_kab = ''
              for (let i = 0; i < count[0].length; i++) {
                if (count[0].length>1&&i==count[0].length-1) {
                  rows[0][0].lintas_kab+=' dan '

                }
                rows[0][0].lintas_kab+= count[0][i].wadmkk
                if (count[0].length>1&&i<count[0].length-2) {
                   rows[0][0].lintas_kab+=' , '
                }
                
              }
              
            }else{
              rows[0][0].status_lintas_kab =0
            }
            if (rowss[0].length > 0) {
              rows[0][0].kecamatan = rowss[0][0].wadmkc
              rows[0][0].desa = rowss[0][0].wadmkd
              rows[0][0].kd_kab = rowss[0][0].kdpkab
              rows[0][0].kd_kec = rowss[0][0].kdcpum
              rows[0][0].kd_desa = rowss[0][0].kdepum
            }else{
              rows[0][0].kecamatan = ''
              rows[0][0].desa = ''
              rows[0][0].kd_kab = ''
              rows[0][0].kd_kec = ''
              rows[0][0].kd_desa = ''
            }
            if ( rowsss[0].length >0) {
              rows[0][0].namobj = rowsss[0][0].namobj
            }else{
              rows[0][0].namobj =''
            }
            if ( das[0].length >0) {
              rows[0][0].das = das[0][0].nama_das
            }else{
              rows[0][0].das =''
            }
            res.send(JSON.stringify(rows[0][0]))

        //connection.end();
        })
              

            

    
module.exports = router;
