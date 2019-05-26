//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const mongo = require('mongo');
const app = express();
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook').Strategy;

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));


app.use(session({
  secret: "My little secret.",
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());
//create a new database userDB
mongoose.set('useCreateIndex', true);
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

//schema for userDB documents
const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});
//google authentication
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({googleId: profile.id}, function(err, user) {
    return cb(err, user);
  })
}
));
//facebook authentication
passport.use(new FacebookStrategy({
  clientID: process.env.FB_CLIENT_ID,
  clientSecret: process.env.FB_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/secrets",
  enableProof: true
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({facebookId: profile.id}, function(err, user) {
      return cb(err, user);
  });
}
));

//get requests ofr different routes---------------------------------------------
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
})

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", function(req, res) {
  User.find({"secret": {$ne:null}}, function(err, foundUsers) {
    if(err) {
      console.log(err);
    }
    else {
      res.render("secrets", {usersWithSecret: foundUsers})
    }
  })
});

app.get("/submit", function(req, res) {
  if(req.isAuthenticated()) {
    res.render("submit");
  }
  else {
    res.render("login");
  }
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});
//google authentication process-------------------------------------------------
app.get("/auth/google", passport.authenticate("google", {scope: ["profile"]}));

app.get("/auth/google/secrets", passport.authenticate("google", {failureRedirect: "/login"}), function(req, res) {
    res.redirect("/secrets");
});

//facebook authentication process-----------------------------------------------
app.get("/auth/facebook", passport.authenticate("facebook"));

app.get("/auth/facebook/secrets", passport.authenticate("facebook", {failureRedirect: "/login"}), function(req, res) {
  res.redirect("/secrets");
});

//submitting secrets
app.post("/submit", function(req, res) {
  const submittedSecret = req.body.secret;
  console.log(req.user._id);
  User.findById(req.user._id, function(err, user) {
    if(err) {
      console.log(err);
    }
    else {
      if(user) {
      user.secret = submittedSecret;
      user.save(function() {
        res.redirect("secrets");
      });
    }
      else {
        console.log("No user found");
      }
      };
  });
});

//post requests ofr different routes--------------------------------------------
app.post("/register", function(req, res) {
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if(err) {
      console.log(err);
      res.redirect("/register");
    }
    else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("secrets");
      })
    }
  })
});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
    if(!err) {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      })
    }
    else {
      console.log(err);
    }
  })
});

//Server
app.listen(3000, function() {
  console.log("Server is running on port 3000.");
})
