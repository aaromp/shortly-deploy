var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function(){
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.find({}).exec( function(err, docs){
    res.send(200, docs);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  var createSha = function(url) {
    var shasum = crypto.createHash('sha1');
    shasum.update(url);
    return shasum.digest('hex').slice(0, 5);
  };

  if (!util.isValidUrl(uri)) {
    console.log('fail')
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  Link.find({url: uri}, function(err, docs){
    if (docs.length === 0){
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          code: createSha(uri),
          base_url: req.headers.origin,
          visits:0
        });



        link.save(function(err, link) {
          console.log('really long thing to find the saved part that saved', err, link);
          res.send(200, link);
        });
      });
    } else {
      // console.log(docs)
      res.send(200, docs[0]);
    }
  });

  // new Link({ url: uri }).fetch().then(function(found) {
  //   if (found) {
  //     res.send(200, found.attributes);
  //   } else {
  //     util.getUrlTitle(uri, function(err, title) {
  //       if (err) {
  //         console.log('Error reading URL heading: ', err);
  //         return res.send(404);
  //       }

  //       var link = new Link({
  //         url: uri,
  //         title: title,
  //         base_url: req.headers.origin
  //       });

  //       link.save().then(function(newLink) {
  //         Links.add(newLink);
  //         res.send(200, newLink);
  //       });
  //     });
  //   }
  // });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;


  User.find({username: username}, function(err, user){
    if (user.length > 0){

      var comparePassword = function(attemptedPassword, actualPassword, callback) {
        bcrypt.compare(attemptedPassword, actualPassword, function(err, isMatch) {
          console.log(err);
          callback(isMatch);
        });
      };

      comparePassword(password, user[0].password, function(match) {
        if (match) {
          util.createSession(req, res, user);
        } else {
          res.redirect('/login');
        }
      });
    } else {
      res.redirect('/login');
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  User.find({username: username}, function(err, docs){
    if (docs.length > 0){
      console.log('Account already exists');
      res.redirect('/login');
    } else {
      var newUser = new User({
        username: username,
        password: password
      });

      newUser.hashPassword = function(){
        var cipher = Promise.promisify(bcrypt.hash);
        return cipher(this.password, null, null).bind(this)
          .then(function(hash) {
            this.password = hash;
            console.log(this.password);
            this.save(function(err){
              util.createSession(req, res, newUser);
            }.bind(this));
          });
      };

      newUser.hashPassword();
    }
  });
};

exports.navToLink = function(req, res){
  Link.update({code: req.params[0]}, {$inc: {visits: 1}}, function(err, num, raw){
    if (err) {
      console.log(err);
      res.redirect('/');
    } else {
      console.log('redirecting');
      Link.find({code: req.params[0]}, function(err, docs){
        if (err) console.log(err);
        if (docs.length > 0) {
          console.log(docs);
          res.redirect(docs[0].url);
        }
      });
    }
  });
  // new Link({ code: req.params[0] }).fetch().then(function(link) {
  //   if (!link) {
  //     res.redirect('/');
  //   } else {
  //     link.set({ visits: link.get('visits') + 1 })
  //       .save()
  //       .then(function() {
  //         return res.redirect(link.get('url'));
  //       });
  //   }
  // });
};
