require("dotenv").config();

const express = require("express");
const app = express();
const port = 3000 || process.env.PORT;
const path = require("path").dirname(require.main.filename);
const nodeMailer = require("nodemailer");
const mailGun = require("nodemailer-mailgun-transport");
const auth = {auth:{apiKey: process.env.API_KEY, domain: process.env.DOMAIN}};
const transporter = nodeMailer.createTransport(mailGun(auth));
const mongo = require("mongodb");
const mongoClient=mongo.MongoClient;
const assert=require("assert");
const dbURL="mongodb://localhost:127.0.0.1:27017/self_presentation";

app.use("/assets", express.static(__dirname+'/assets'));
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");

addToDatabase = (name, email, subject, message, postResponse) => // function for saving the data into the database (I AM USING A MONGODB NOSQL DATABASE)
{
    mongoClient.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true}, (err, db) => // creating a connection to the database
    {
        const dbObject=db.db("mailDB"); // database name

        if(err) // if there was an error, we'll be redirected to the fail route
            postResponse.redirect("/fail");
        dbObject.collection("self_presentation").insertOne({email: email, name: name, subject: subject, message: message}, (err1, result) => // inserting the data
        {
            assert.strictEqual(null, err1);
            db.close(); // closing the connection to the database
        });

        postResponse.redirect("/success"); // if there wasn't any error, we'll be redirected to the success route
    });  
}

app.get("/", (req, res) => // root route
{
    res.redirect("/home");
});

app.get("/home", (req, res) => // home route
{
    res.sendFile(path + '/index.html');
});

app.get("/fail", (req, res) => // fail route
{
    res.render("response", {message: "Oops! Something didn't work as expected", title: "Fail"});
});

app.get("/success", (req, res) => // success route
{
    res.render("response", {message: "Yey! Everything worked properly", title: "Success"});
});

app.post("/send-form", (req, res) => // route where we'll be redirected if the form was submitted -> route for sending the mail
{
    const mailOptions = {from: req.body.email, to: process.env.EMAIL, subject: req.body.subject, text: req.body.message};

    transporter.sendMail(mailOptions, (err) =>
    {
        if(err) // if there was an error, we'll be redirected to the fail route
            res.redirect("/fail");
        else addToDatabase(req.body.name, req.body.email, req.body.subject, req.body.message, res); // if there wasn't any error, we'll be adding the data into the database
    });
});

app.get("*", (req, res) => // if the route doesn't exit
{
    res.render("response", {message: "Oops! The requested page doesn't exist", title: "Not found"});
});

app.listen(port); // setting up the server