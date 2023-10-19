//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import ejs from "ejs";
import mongoose from "mongoose";
import "dotenv/config";

const app = express();

const port = process.env.PORT || 3001;
const uri = "mongodb+srv://danieldeveloper:g16laqyjwRIUEdZC@clusterforuser.fdrcpjr.mongodb.net/?retryWrites=true&w=majority"
 


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));


async function conectionDB() {
  await mongoose
  .connect(uri, { 
    serverSelectionTimeoutMS: 5000,
    useNewUrlParser: true })
  .then(() => console.log("Connected!")).catch((err) => {console.log(err.reason)})
}
conectionDB()


const userSchema = {
  email: String,
  password: String,
};

const userDB = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  try {
    res.render("home");
  } catch (error) {
    res.send(error.message);
  }
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


app.post("/register", async (req, res) => {
  // const email = req.body.username
  // const password = req.body.password

  //Data from form in register.ejs and inserted to the MongoDB schema(email, password);
  const newUser = new userDB({
    email: req.body.username,
    password: req.body.password,
  });

  //MongoDB save() method updates an existing document or inserts a document depending on the parameter.
  newUser
    .save()
    .then(res.status(201).render("secrets"))

    .catch((err) => {
      res.status(500).send({ message: `${err.message} - falha ao cadastrar.` });
    });
});


app.post("/login", async (req, res) => {
    //Mongoose dropped callback now you need to use try/catch

  try {

    //Getting Data from form input in login.ejs
    const userNameLogin = req.body.username
    const userPasswordLogin = req.body.password

    //MongoDB findOne() method returns only one document that satisfies the criteria entered when no document is found it returns a null.
    const dbData = await userDB.findOne({email: userNameLogin})
    console.log(dbData)

    if (dbData) {

    //comparing Data in database with form input data in login.ejs
      if (dbData.password === userPasswordLogin) {
        res.render("secrets");
      } 

      else {
        res.send("ErrorPassword");
        console.log("Error");
      }

    }}
    catch (err) {
    res.send("No data found " + err);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
