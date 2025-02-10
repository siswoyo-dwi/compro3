
/*
 * GET home page.
 */
// import database

 var mysql      = require('mysql');

module.exports.connection = mysql.createPool({
  host     : 'localhost',
  user     : 'root',
  port	   : '3306',
  password : '*Yukihana777*',
  database : 'fosan'
});
