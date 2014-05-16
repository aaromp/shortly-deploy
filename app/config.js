// var Bookshelf = require('bookshelf');
// var mongoose = require('mongoose');
var path = require('path');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/db');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  // yay connected!
});


// mongoose.connect('mongodb://username:password@host:port/database?options...');


// var db = Bookshelf.initialize({
//   client: 'sqlite3',
//   connection: {
//     host: process.env.IP,
//     user: 'your_database_user',
//     password: 'password',
//     database: 'shortlydb',
//     charset: 'utf8',
//     filename: path.join(__dirname, '../db/shortly.sqlite')
//   }
// });

db.urlsSchema = new Schema({
  url: String,
  base_url: String,
  code: String,
  title: String,
  visits: Number
});

db.usersSchema = new Schema({
  username: String,
  password: String,
  timestamp: Date
});


module.exports = db;
