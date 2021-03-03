const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
//mongoose.set('useCreateIndex', true);
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/diaryDB", {useNewUrlParser: true, useUnifiedTopology: true,});

//mongoose.set('useFindAndModify', false);
const userSchema = new mongoose.Schema ({
	username: String,
	password: String,
	diary: [{
		date: String,
	    content: String
	}]
});

userSchema.plugin(passportLocalMongoose);


const User = mongoose.model("User", userSchema);


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var current_user;
var loggedIn = "false";

app.get("/", function (req,res){
	res.render("home")
});

app.get("/signin", function (req,res){
	if (loggedIn==="true"){
    res.redirect("/page");
	//console.log(user);
   } else {
    res.render("signin");
  }
	
});

app.post("/signin", function (req,res){
	
	User.register({username: req.body.username},req.body.password,function(err,newUser){
		if(err){
			
			console.log(err)
		    res.redirect("/signin");
		} else{
			user = newUser;
		    res.redirect("/page");
		}
		
	});
});

app.get("/login", function (req,res){
	if (loggedIn==="true"){
    res.redirect("/page");
  } else {
    res.render("login");
  }
});



app.get("/page", function(req, res){
  if (loggedIn==="true"){
    res.render("page",{diary: current_user.diary});
  } else {
    res.redirect("/login");
  }
});


app.post("/login", function(req, res){
	const user = new User({
    username: req.body.username,
    password: req.body.password
    });
  req.login(user, function(err){
	 
    if (err) {
	
	  res.redirect("/login");
    } else {
		
		
      passport.authenticate("local")(req, res, function(){
		  
		 User.findOne({username: req.body.username}, function(err,foundUser){
			
		if(!err){
			current_user = foundUser;
			loggedIn="true";

		}
	   });
        res.redirect("/page");
		});
	  }
	});
});


app.get("/compose", function(req, res){
	if (loggedIn==="true"){
    res.render("form");
  } else {
    res.redirect("/login");
  }
});

app.post("/compose", function(req, res){
	const entry = {date: req.body.date, content: req.body.content};
	current_user.diary.push(entry);
	current_user.save();
	res.redirect("/page");
});


app.get("/logout", function (req,res){
	req.logout();
        loggedIn = "false";
	res.redirect("/");
});

app.get("/post/:date", function(req, res){
  const requestedDate = req.params.date;
	for(var i=0;i<current_user.diary.length;i++)
	{
		if(current_user.diary[i].date === requestedDate)
		{
			res.render("diary",{entry : current_user.diary[i]});
			break;
		}
	}

});

app.get("/delete/:id", function(req, res){

  const toDelete = req.params.id;
  
	User.findOneAndUpdate({_id: current_user._id},{$pull:{diary:{_id: toDelete }}},function(err,foundEntry){
		if(!err){
			//console.log(foundEntry.diary);
			
			//res.redirect("/page");
		}
	});  
	
	User.findOne({_id: current_user._id}, function(err,foundUser){
		if(!err){
			current_user= foundUser;
			res.redirect("/page");

		}
	   });
  
  
  
  
   
 
});




app.listen(3000,function()
{
	console.log("Server is running on port 3000");
});













