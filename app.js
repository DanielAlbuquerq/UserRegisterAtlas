//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import ejs from "ejs";
import mongoose from "mongoose";
import 'dotenv/config';


const app = express();
const port = process.env.PORT || 3001;

const uri = "mongodb+srv://danieldeveloper:g16laqyjwRIUEdZC@clusterforuser.fdrcpjr.mongodb.net/?retryWrites=true&w=majority";

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(uri,  {useNewUrlParser: true}).then(() => console.log('Connected!'))

const userSchema = {
    email: String,
    password: String
}

const UserDB = new mongoose.model("User", userSchema)

// app.use(async (req, res, next) => {
//     try {
//      await mongoose.connect(uri,  {useNewUrlParser: true}).then(() => console.log('Connected!'))
//     } catch (error) {
//         res.send(err.message)
//     }
//     next() });

app.get("/", async (req, res) => {
    try {
        res.render('home')
    } catch (error) {
        res.send(error.message)
    }
});


app.get("/login", async (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        res.send(error.message)
    }
})


app.get("/register", async (req, res) => {
    try {
        res.render('register')
    } catch (error) {
        res.send(error.message)
    }
})


app.post("/register", async (req, res) => {

        // const email = req.body.username
        // const password = req.body.password

        const newUser = new UserDB({
            email: req.body.username,
            password: req.body.password
        });

        newUser.save().then(res.status(201).render("secrets")) 
        .catch((err) => {
            res.status(500).send({message: `${err.message} - falha ao cadastrar.`})
        })
    })

// app.post("/login", function(req, res){

//     const userNameLogin = req.body.email;
//     const userPasswordLogin = req.body.password;
//     UserDB.findOne({email: userNameLogin}, checkFunction)

//     function checkFunction(error, foundUser){
//         if(err){
//             console.log(err);
//         } else {
//             if ()
//         }
//     }

// })
        // function(err){
        //     if (err) {
        //         console.log(err);
        //     } else {
        //         res.render("secrets");
        //     }
        // })

    // } catch (error) {
    //     res.send("catchError" + error.message)
    // }
// })









app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  