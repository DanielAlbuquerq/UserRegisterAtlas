//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import axios from "axios";
import ejs from "ejs";
// import encrypt from "mongoose-encryption";
// import from ";
import "dotenv/config";


import session from 'express-session';
import passport  from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate from 'mongoose-findorcreate';


const app = express();
const port = process.env.PORT || 3001;


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));


//______________________passport SESSION CONNECTION START__________________________
//--set up for session---.
app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: true,
}));

//--initialize passport and use a passport to manage the session---.
app.use(passport.initialize());
app.use(passport.session());
//______________________passport SESSION CONNECTION END____________________________.



//______________________MongoDB CONNECTION START_________________________________
async function connectDB(){
  await mongoose.connect(process.env.DB_CONN)
  .then(console.log("MongoDB connected"))
  .catch((err)=>(console.log(err)));
}
connectDB()
//______________________MongoDB CONNECTION END_____________________________________.


//______________________MongoDB SCHEMA START_______________________________________
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});
// userSchema.plugin(encrypt, { secret: process.env.SECRETKEY, encryptedFields: ['password'] });
//______________________MongoDB SCHEMA END__________________________________________.


//userSchema will use passport local mongoose as a plugin.
userSchema.plugin(passportLocalMongoose);

//Simple plugin for Mongoose which adds a findOrCreate method to models. This is useful for libraries like Passport which require it.
userSchema.plugin(findOrCreate);

//Now we pass userSchema with plugin to our model.
const userDB = new mongoose.model("User", userSchema);


//We used passport local mongoose to create a local log in strategy.
passport.use(userDB.createStrategy());


//passport to serialise and deserialise our user.
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});
 
passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


//_______________Here I Configure passport-google-oauth20 Strategy____START________
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile.displayName)

  //findOrCreate npm external mongoose method and I get profile.id from GoogleStrategy and mongoose method find or insert the profile.id to database.
  userDB.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));
//_______________Here I Configure passport-google-oauth20 Strategy____END________.


app.get("/", (req, res) => {
  try {
    res.render("home");
  } catch (error) {
    res.send(error.message);
  }
});

//Use passport.authenticate(), specifying our 'google' strategy over this line, to authenticate requests.
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
  );



app.get('/auth/google/secrets', 
passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
  // Successful authentication, redirect to secrets page.
  res.redirect('/secrets');
});


app.get("/login", (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    res.send(error.message);
  }
});


app.get("/register", (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    res.send(error.message);
  }
});


app.get("/secrets", function(req, res){

  //This if condition check the authentication (data from cookies) from passport.authenticate in app.post("/register") below; 
  if(req.isAuthenticated()){
    res.render("secrets");
  } else {
    console.log('noAuthenticated')
    res.redirect("/login")
  }
})

app.get("/logout", function(req, res){

  // Passport logout() will remove the req.user property and clear the login session.
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect("/"); 
  });
  
});

app.post("/register", async (req, res) => {

  //this register() method comes from the passport-local-mongoose package, where we can set data to our cookies
  userDB.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register")
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets"); 
      });
    } 
  });


  // // const email = req.body.username
  // // const password = req.body.password


  // //Data from form in register.ejs and inserted to the MongoDB schema(email, password);
  // const newUser = new userDB({
  //   email: req.body.username,
  //   password: req.body.password
  // });


  // //MongoDB save() method updates an existing document or inserts a document depending on the parameter.
  // newUser
  //   .save()
  //   .then(res.status(201).render("secrets"))

  //   .catch((err) => {
  //     res.status(500).send({ message: `${err.message} - falha ao cadastrar.` });
  //   });
});

app.post("/login", async (req, res) => {
  
  const user = new userDB({
    username: req.body.username,
    password: req.body.password
  })


  //login() function on req (also aliased as logIn()) that can be used to establish a login session.
  req.login(user, function(err) {

    console.log(user)

    if (err) {
      console.log(err)

    } else {

      console.log("User Authenticate" + user)
      passport.authenticate("local")(req, res, function(){
      res.redirect("/secrets"); 

      });
    }
  });
  //   //Mongoose dropped callback now you need to use try/catch


  // try {

  //   //Getting Data from form input in login.ejs
  //   const userNameLogin = req.body.username
  //   const userPasswordLogin = req.body.password;

  //   //MongoDB findOne() method returns only one document that satisfies the criteria entered when no document is found it returns a null.
  //   const dbData = await userDB.findOne({email: userNameLogin})
  //   console.log(dbData)

  //   if (dbData) {

  //   //comparing Data in database with form input data in login.ejs
  //     if (dbData.password === userPasswordLogin) {
  //       res.render("secrets");
  //     } 

  //     else {
  //       res.send("ErrorPassword");
  //       console.log("Error");
  //     }

  //   }}
  //   catch (err) {
  //   res.send("No data found " + err);
  // }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
