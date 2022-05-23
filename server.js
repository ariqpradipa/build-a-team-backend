//import packages
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const { Client } = require("pg");
const bcrypt = require("bcrypt");

var corsOptions = {
  origin: "http://localhost:8081"
};
app.use(cors(corsOptions));
//middleware (session)
app.use(
  session({
    secret: "ini contoh secret",
    saveUninitialized: false,
    resave: false,
  })
);
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
var temp;

const db = new Client({
  user: "proyek_akhir",
  host: "aidan-sbd.postgres.database.azure.com",
  database: "buildateam",
  password: "password123",
  port: "5432",
  sslmode: "require",
  ssl: true,
});

db.connect((err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log("Database berhasil terkoneksi");
});

app.post("/register", (req, res) => {
  temp = req.session;
  temp.username = req.body.username;
  temp.password = req.body.password;
  console.log(temp.username);
  console.log(temp.password);

  // Use bcrypt.hash() function to hash the password
  bcrypt.hash(temp.password, 10, (err, hashedPassword) => {
    if (err) {
      return err;
    }

    const query = `INSERT INTO users VALUES ('${temp.username}', '${hashedPassword}');`;
    db.query(query),
      (err, results) => {
        if (err) {
          console.log(err);
          return;
        }
        console.log(results);
        console.log("Data insert berhasil");
      };
  });
  res.end("user berhasil dibuat");
});

app.post("/login", (req, res) => {
  temp = req.session;
  temp.username = req.body.username;
  temp.password = req.body.password;
  console.log(temp.username);
  console.log(temp.password);

  const query = `SELECT password FROM users WHERE username LIKE '${temp.username}';`;
  db.query(query, (err, results) => {
    if (err) {
      alert("Login Failed");
      res.end("failed");
    }

    bcrypt.compare(temp.password, results.rows[0].password, (err, isMatch) => {
      if (err) {
        res.send('failed');
      }
      //If password matches then display true
      console.log(`is Match = ${isMatch}.`);
      res.end("Login");
    });
  });
});

app.listen(8000, () => {
  console.log("Server Kelompok 7 berjalan");
});
