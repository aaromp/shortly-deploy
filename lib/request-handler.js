var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');
var Users = require('../app/collections/users');
var Links = require('../app/collections/links');

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
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  })
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username })
    .fetch()
    .then(function(user) {
      if (!user) {
        res.redirect('/login');
      } else {
        user.comparePassword(password, function(match) {
          if (match) {
            util.createSession(req, res, user);
          } else {
            res.redirect('/login');
          }
        })
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

        newUser.comparePassword = function(attemptedPassword, callback) {
          bcrypt.compare(attemptedPassword, this.password, function(err, isMatch) {
            callback(isMatch);
          });
        };

        newUser.hashPassword();

        // newUser.save(function(err, product){
        //   console.log(product);
        //   console.log('old password ', product.password);
        //   product.hashPassword();
        //   console.log('hashed password ', product.password);
        //   util.createSession(req, res, product);
        // });
      }
      // console.log(docs);
    });
  // User.find({ username: username }, function(a, b, c){
  //   console.log('first param ', a,'second param ', b, 'third param ', c);
  //   if (!user) {
  //     var newUser =User.create({
  //       username: username,
  //       password: password
  //     }, function(err, result){
  //         if (err){
  //           console.error(err);
  //         }


  //         this.hashPassword = function(){
  //           var cipher = Promise.promisify(bcrypt.hash);
  //           return cipher(this.password, null, null).bind(this)
  //             .then(function(hash) {
  //               this.password = hash;
  //             });
  //         };

  //         console.log(this.password);
  //         this.hashPassword();
  //         console.log(this.password);

  //         this.comparePassword = function(attemptedPassword, callback) {
  //           bcrypt.compare(attemptedPassword, this.get('password'), function(err, isMatch) {
  //             callback(isMatch);
  //           });
  //         };
  //       });

  //     db.collection.insert({username: username, password: password}, function(err) {
  //       util.createSession(req, res, newUser);
  //     }).save();
  //   } else {
  //     console.log('Account already exists');
  //     res.redirect('/signup');
  //   }
  // })
};

exports.navToLink = function(req, res) {
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
