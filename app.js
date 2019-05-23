//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const mongo = require('mongo');
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

//create a new database userDB
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

//schema for userDB documents
const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});


const User = new mongoose.model("User", userSchema);

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

//post requests ofr different routes---------------------------------------------
app.post("/register", function(req, res) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    var user = new User({
      email: req.body.username,
      password: hash
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
});

app.post("/login", function(req, res) {
  User.findOne({email: req.body.username}, function(err, foundUser) {
    if(err) {
      console.log(err);
    }
    else {
      bcrypt.compare(req.body.password, foundUser.password, function(err,result) {
        if(result === true) {
            res.render("secrets");
        }
        else {
          console.log("Incorrect password.");
        }
      })
    }
  });
});

//Server
app.listen(3000, function() {
  console.log("Server is running on port 3000.");
})
