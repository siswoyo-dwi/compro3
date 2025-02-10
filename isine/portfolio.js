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


router.get('/', function(req, res) {
    res.render('content/portfolio'); 
});
router.get('/kategori/:id', function(req, res) {
    res.render('content/portfolio_kategori',{id:req.params.id}); 
});   
router.get('/kategori/detail/:id', function(req, res) {
    res.render('content/detail_portfolio',{id:req.params.id}); 
});        

    
module.exports = router;
