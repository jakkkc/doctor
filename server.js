const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const session = require("express-session");

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// add express session middleware
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

const users = fs.readFileSync("users.json");
const parsedUsers = JSON.parse(users);

const patients = fs.readFileSync("patients.json");
const parsedPatients = JSON.parse(patients);

app.use(express.static("public"));
app.set("view engine", "hbs");
app.set("views", "views");

//declare the routes
app.get("/", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { email, password, role } = req.body;
  const user = parsedUsers.find(
    (user) =>
      user.email === email && user.password === password && user.role === role
  );

  if (user) {
    req.session.role = user.role;
    res.redirect("/patientsrecords");
  } else {
    res.redirect("/");
  }
});

// add middleware to check if the user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session.role) {
    next();
  } else {
    res.redirect("/");
  }
};

app.get("/patientsrecords", isLoggedIn, (req, res) => {
  if (req.session.role === "doctor") {
    res.render("allpatients", { parsedPatients });
  } else if (req.session.role === "receptionist") {
    res.render("allpatientsr", { parsedPatients });
  } else {
    res.redirect("/");
  }
});

app.get("/newpatient", isLoggedIn, (req, res) => {
  if (req.session.role === "receptionist") {
    res.render("addpatients");
  } else {
    res.redirect("/");
  }
});

app.post("/newpatient", isLoggedIn, (req, res) => {
  if (req.session.role === "receptionist") {
    const { email, name, gender, age, phone, ailment } = req.body;
    const patientDetails = { email, name, gender, age, phone, ailment };
    parsedPatients.push(patientDetails);
    // parsedpatients.push(req.body);

    fs.writeFile("patients.json", JSON.stringify(parsedPatients), (err) => {
      if (err) throw err;
      res.render("allpatientsr");
    });
  } else {
    res.redirect("/");
  }
});

app.get("/updatepatient/:email", isLoggedIn, (req, res) => {
  if (req.session.role === "doctor") {
    const patient = parsedPatients.find((p) => p.email === req.params.email);
    res.render("updates", { patient });
  } else {
    res.redirect("/");
  }
});

app.post("/updatepatient/:email", isLoggedIn, (req, res) => {
  if (req.session.role === "doctor") {
    // console.log("params", req.params);
    const patient = parsedPatients.find((p) => p.email === req.params.email);
    const { email, name, gender, age, phone, ailment, prescription } = req.body;
    if (patient) {
      patient.email = email;
      patient.name = name;
      patient.gender = gender;
      patient.age = age;
      patient.phone = phone;
      patient.ailment = ailment;
      patient.prescription = prescription;

      fs.writeFile("patients.json", JSON.stringify(parsedPatients), (err) => {
        if (err) throw err;
        res.redirect("/patientsrecords");
      });
    } else {
      alert("patient not found!!");
    }
  } else {
    res.redirect("/");
  }
});

// app.post("/updatepatient/:email", (req, res) => {
//   const index = parsedPatients.findIndex((p) => p.email === req.params.email);
//   console.log("params", req.params);
//   if (index !== -1) {
//     parsedPatients[index].ailment = req.body.ailment;
//     parsedPatients[index].prescription = req.body.prescription;
//     res.redirect("/patientrecords");
//   } else {
//     alert("patient not found!!");
//   }
// });

app.get("/logout", (req, res) => {
  res.render("login");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
