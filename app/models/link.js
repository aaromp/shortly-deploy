var db = require('../config');
var crypto = require('crypto');

var Link = db.model('link', db.urlsSchema);

module.exports = Link;
