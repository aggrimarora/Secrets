//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const mongo = require('mongo');
const encrypt = require('mongoose-encryption');
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
})

app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req, res) {
  var user = new User({
    email: req.body.username,
    password: req.body.password
  });
  user.save(function(err) {
    if(err) {
      console.log(err);
    }
    else {
      res.render("secrets");
    }
  });
});

app.post("/login", function(req, res) {
  User.findOne({email: req.body.username}, function(err, foundUser) {
    if(err) {
      console.log(err);
    }
    else {
      if(req.body.password === foundUser.password) {
        res.render("secrets");
      }
    }
  });
});

app.listen(3000, function() {
  console.log("Server is running on port 3000.");
})
