require("dotenv").config();

const express = require("express");
const app = express();
const port = 3000 || process.env.PORT;
const path = require("path").dirname(require.main.filename);
const nodeMailer = require("nodemailer");
const mailGun = require("nodemailer-mailgun-transport");
const auth = {
  auth: { apiKey: process.env.API_KEY, domain: process.env.DOMAIN },
};
const transporter = nodeMailer.createTransport(mailGun(auth));
const mongo = require("mongodb");
const mongoClient = mongo.MongoClient;
const assert = require("assert");
const dbURL = "mongodb://localhost:127.0.0.1:27017/self_presentation";

app.use("/assets", express.static(__dirname + "/assets"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// function for saving the data into the database
const addToDatabase = (name, email, subject, message, postResponse) => {
  // creating a connection to the database
  mongoClient.connect(
    dbURL,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err, db) => {
      // database name
      const dbObject = db.db("mailDB");
      // redirecting to the fail route if there was an error
      if (err) {
        postResponse.redirect("/fail");
      }

      // inserting the data
      dbObject
        .collection("self_presentation")
        .insertOne(
          { email: email, name: name, subject: subject, message: message },
          (err1, result) => {
            assert.strictEqual(null, err1);
            // closing the connection to the database
            db.close();
          }
        );

      // redirecting to the success route if there wasn't any error
      postResponse.redirect("/success");
    }
  );
};

// root route
app.get("/", (req, res) => {
  res.redirect("/home");
});

// home route
app.get("/home", (req, res) => {
  res.sendFile(path + "/index.html");
});

// fail route
app.get("/fail", (req, res) => {
  res.render("response", {
    message: "Oops! Something didn't work as expected",
    title: "Fail",
  });
});

// success route
app.get("/success", (req, res) => {
  res.render("response", {
    message: "Yey! Everything worked properly",
    title: "Success",
  });
});

// route where we'll be redirected if the form was submitted -> route for sending the mail
app.post("/send-form", (req, res) => {
  const mailOptions = {
    from: req.body.email,
    to: process.env.EMAIL,
    subject: req.body.subject,
    text: req.body.message,
  };

  transporter.sendMail(mailOptions, (err) => {
    // redirecting to the fail route if there was an error
    if (err) {
      res.redirect("/fail");
    }
    // adding the data into the database if there aren't any errors
    else {
      addToDatabase(
        req.body.name,
        req.body.email,
        req.body.subject,
        req.body.message,
        res
      );
    }
  });
});

// if the route doesn't exit
app.get("*", (req, res) => {
  res.render("response", {
    message: "Oops! The requested page doesn't exist",
    title: "Not found",
  });
});

// setting up the server on the given port
app.listen(port);
