var express = require('express')
  , http = require('http')
  , path = require('path')
  , logger = require('morgan')
  , bodyParser = require('body-parser')
  , methodOverride = require('method-override')
  , static = require('serve-static')
  , errorHandler =require('errorhandler')
  , passport = require('passport')
  , session = require('express-session')
  , cookieParser = require('cookie-parser')
  , flash=require("connect-flash")
  , LocalStrategy = require('passport-local').Strategy;
  var svgCaptcha = require('svg-captcha');

var rooturl = ''
var login = require('./isine/login.js').router;
var peta = require('./isine/topojson.js');
var upload = require('./isine/upload_file.js');
// var upload_shp = require('./isine/upload_shp.js');
var fn = require('./isine/ckeditor-upload-image.js');
var upload_excel = require('./isine/upload_excel.js');
var cek_login = require('./isine/login.js').cek_login;
var cek_login_all = require('./isine/login.js').cek_login_all;

// FE
var basic = require('./isine/basic.js');


// BO
// API
var user = require('./isine/user.js');

var app = express();
var connection = require('./database/index.js').connection;
var sql_enak = require('./database/mysql_enak.js').connection;

//var mysql2geojson = require("mysql2geojson");
var router = express.Router();
var dbgeo = require("dbgeo");
app.set('views', __dirname + '/views');
//app.set('view engine', 'jade');
//app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');


//end dbf dan shp
// all environments
app.set('port', process.env.PORT || 8869);

//app.use(express.favicon());
app.use(function (req, res, next) {

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
app.use(logger('dev'));
app.use(methodOverride());
app.use(static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser() );
app.use(session({duration: 50 * 60 * 1000,
                      activeDuration: 10 * 60 * 1000,
                       secret: 'bhagasitukeren', 
                       cookie: { maxAge : 60 * 60 * 1000 },
                       cookieName: 'session',
                       saveUninitialized: true,
                        resave: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());  
// Add headers

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}
 var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));  
});
var io = require('socket.io').listen(server, { log: false });

//mulai apps ----------------------------------------------------------
app.use('/autentifikasi', login);
app.use('/peta', peta);
app.use('/upload', upload);
// app.use('/upload_shp', upload_shp);
app.use('/uploadckeditor', fn);
app.use('/upload_excel', upload_excel);
// FE
app.use('/basic', basic);
// BO
// API
app.use('/user', user);

app.get('/backoffice', cek_login,async function (req, res) {
  res.render('content-backoffice/index',{user:req.user[0]});
});

app.get('/',async function (req, res) {
 
  res.render('content/index');
});
app.get('/about_us',async function (req, res) {
 
  res.render('content/about_us');
});
// app.get('/4E26CD6CB47148CCFB9334CB15B95495.txt', function (req, res) {
//   console.log(req.user)
//   //res.render('7ECA9DC7A2167A6EB33B60F1DA8B85E1.txt');
//   var file = __dirname + '/4E26CD6CB47148CCFB9334CB15B95495.txt';
//     res.download(file);
// });
// app.listen(800, function () {
//   console.log('Example app listening on port 800!');
//admin
//mysql

app.use(function (req, res, next) {
  res.render('page_not_found');
  // res.status(404).send("Halaman yang anda tuju tidak ada!")
})
  
// <!-- start socketio connection -->

io.sockets.on('connection', function (socket) {	

});
