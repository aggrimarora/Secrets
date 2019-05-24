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
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
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
  if(req.isAuthenticated()) {
    res.render("secrets");
  }
  else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

//post requests ofr different routes---------------------------------------------
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
  // User.findOne({email: req.body.username}, function(err, foundUser) {
  //   if(err) {
  //     console.log(err);
  //   }
  //   else {
  //     bcrypt.compare(req.body.password, foundUser.password, function(err,result) {
  //       if(result === true) {
  //           res.render("secrets");
  //       }
  //       else {
  //         console.log("Incorrect password.");
  //       }
  //     })
  //   }
  // });
});

//Server
app.listen(3000, function() {
  console.log("Server is running on port 3000.");
})
