var connection = require('../database').connection;
var express = require('express');
var router = express.Router();
var sql_enak = require('../database/mysql_enak.js').connection;
var svgCaptcha = require('svg-captcha');

var md5 = require('md5');
var rooturl = ''
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , static = require('serve-static')
  , bodyParser = require('body-parser')
  , session = require('express-session')
  , cookieParser = require('cookie-parser')
  , flash=require("connect-flash")
  ,  sha1 = require('sha1');

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;


  router.use(bodyParser.urlencoded({ extended: true }));
  router.use(bodyParser.json());
  router.use(cookieParser() );
  router.use(session({ secret: 'bhagasitukeren', cookie: { maxAge : 1200000 },saveUninitialized: true, resave: true }));
  router.use(passport.initialize());
  router.use(passport.session());
  router.use(flash());  
// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});
passport.use(new LocalStrategy({
  passReqToCallback : true
},
function(req, username, password, done) {
  console.log([ username, password , req.body]);
  
  if (req.session.captcha ==req.body.captcha) {

  let a = 0
  let b = 0
  let c = 0
  let d = 0
  for (let i = 0; i < password.length; i++) {
      if ( password.charCodeAt(i) >=49 &&password.charCodeAt(i) <=57 ) {
      a+=1
      }else if ( password.charCodeAt(i) >=65 &&password.charCodeAt(i) <=90 ) {
      b+=1
      }else if ( password.charCodeAt(i) >=97 &&password.charCodeAt(i) <=122 ) {
      c+=1
      }else{
      d+=1
      }
  }
  if (a!=0&&b!=0&&c!=0&&d!=0) {

  sql_enak.raw("SELECT * from user WHERE username=?",[username]).then(function(rows) {
  if(rows[0].length >0){
    rows[0][0].tujuan = req.body.tujuan;
      if (rows[0][0].pwd != sha1(password)&&rows[0][0].password != sha1(password)) {
        return done(null, false, req.flash('pesan','Password salah'), req.flash('tujuan',req.body.tujuan));
      }else{
        return done(null, rows[0]);
      }
    }else{
      return done(null, false, req.flash('pesan','Username tidak ditemukan'), req.flash('tujuan',req.body.tujuan));
    }
  });
}else{
  return done(null, false, req.flash('pesan','pemberian password perlu kombinasi huruf besar ,huruf  kecil ,angka dan karakter\nSilahkan ulang kembali'), req.flash('tujuan',req.body.tujuan));

}
     
}else{
return done(null, false, req.flash('pesan','Captcha Salah!!'), req.flash('tujuan',req.body.tujuan));

}
}
    	
));
passport.use(new GoogleStrategy({
    clientID: "1017151440022-7jkuiqa8t0eqpebbl85nktugmh8rqpvm.apps.googleusercontent.com",
    clientSecret: "37VDcokioP5LluYvts_rfZio",
    callbackURL: "https://urldomain.com/autentifikasi/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      sql_enak.raw("SELECT * from user WHERE email='' and google='1'",[profile.emails[0].value]).then(function(rows) {
        if(rows[0].length >0){
              return done(null, rows[0]);
        }else{
          sql_enak.raw("insert into user (id_google, fullname, google, foto, email) VALUES (?,?, '1',?,?)",[profile.id,profile.displayName,profile.photos[0].value,profile.emails[0].value]).then(function(rows) {
          })
        }
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
router.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect("/backoffice")}
  );


router.get('/',async function(req, res) {
var tujuan = req.flash('tujuan');
var pesan = req.flash('pesan');
var menuju = "/backoffice";
	if(tujuan!=""){
		 menuju = tujuan;
	}
  else if(req.query.tujuan != undefined){
    menuju = req.query.tujuan;
  }
  // const captcha = new CaptchaGenerator(); //getting captcha constructor
  // const buffer = await captcha.generate(); //returns buffer of the captcha image    
  // req.session.captcha = captcha.text; //returns text of the captcha image.   
  // const base64Image = buffer.toString('base64');
  var captcha = svgCaptcha.createMathExpr({mathMin:1,mathMax:9,mathOperator:'+'});
  req.session.captcha = captcha.text;
	// res.render('login', { pesan: pesan, tujuan : menuju , buffer:base64Image});
  res.render('login', { pesan: pesan, tujuan : menuju , captcha});

});
// define the home page route
router.post('/login',
  passport.authenticate('local', { 
                                   failureRedirect: rooturl+'/autentifikasi',
                                   failureFlash: true }), function(req, res) {
    res.redirect(req.user[0].tujuan)}
);
router.post('/login_user',
  passport.authenticate('local', { 
                                   failureRedirect: rooturl+'/?p=Pastikan username , password dan captcha ter isi dengan benar',
                                   failureFlash: true }), function(req, res) {
    res.redirect(req.user[0].tujuan)}
);
router.post('/login_opd',
  passport.authenticate('local', { 
                                   failureRedirect: rooturl+'/autentifikasi',
                                   failureFlash: true }), function(req, res) {
                                    res.json(req.user[0])
                                  });
// define the about route
router.get('/logout', function(req, res){
  req.logout();
  res.redirect(rooturl+'/');
});
router.get('/logout_depan', function(req, res){
  req.logout();
  res.redirect(rooturl+'/');
});
router.get('/logout_opd', function(req, res){
  req.logout();
  res.redirect(rooturl+'/login_user');
});
router.get('/logout_google', function(req, res){
  req.logout();
  res.redirect('https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=https://simaju.fosan.id');
});

module.exports.router = router;
module.exports.cek_login = function(req, res, next) {
console.log('cek_login');

	if (req.isAuthenticated() && req.user[0].google != 1 &&  req.user[0].is_admin ==1){
        next();
	
    } else {
        res.redirect(rooturl+'/autentifikasi?tujuan='+rooturl+encodeURIComponent(req.originalUrl));
    }
}
module.exports.cek_login_google = function(req, res, next) {
  console.log('cek_login_google');
  
  if (req.isAuthenticated() && req.user[0].google == 1){
      next()
  
    } else {
        res.redirect(rooturl+'/autentifikasi/auth/google?tujuan='+rooturl+encodeURIComponent(req.originalUrl));
    }
}
module.exports.cek_login_all = function(req, res, next) {
  console.log('cek_login_all');
  
console.log([req.isAuthenticated(),req.user,'cek_login_all']);

	if (req.isAuthenticated()||req.headers.token == 'ba71cc700b29dee1a57171560882bbe7563c6ce8' ){
        next();
    } else {
        res.redirect(rooturl+'/');
    }
}
module.exports.cek_login_upt = function(req, res, next) {

	if (req.isAuthenticated() && req.user[0].role == 1){
        next();
    } else {
        res.redirect(rooturl+'/');
    }
}