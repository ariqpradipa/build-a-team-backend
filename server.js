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
    db.query(query), (err, results) => {
      if (err) {
        console.log(err);
        return;
      }
      console.log(results.rows[0]);
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

app.post("/createplayer", (req, res) => {
  const queryIdentitas = `INSERT INTO identitas(nama, umur, no_punggung, tinggi, berat_badan) VALUES ('${req.body.nama}', ${req.body.umur}, ${req.body.no_punggung}, ${req.body.tinggi}, '${req.body.berat_badan}');`;
  const queryStatistik = `INSERT INTO statistik(agility, defence, shooting, passing, stamina, dribbling) VALUES (${req.body.agility}, ${req.body.defence}, ${req.body.shooting}, ${req.body.passing}, ${req.body.stamina}, ${req.body.dribbling});`;

  db.query(queryIdentitas, (err, resultsIdentitas) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(resultsIdentitas);

  });
  db.query(queryStatistik, (err, resultsStatistik) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(resultsStatistik);
  });

  const queryGetIndentitas = `SELECT * FROM identitas ORDER BY id_identitas DESC LIMIT 1;`;
  const queryGetStatistik = `SELECT * FROM statistik ORDER BY id_statistik DESC LIMIT 1;`;
  db.query(queryGetIndentitas, (err, resultsGetIndentitas) => {
    if (err) {
      console.log(err);
      return;
    }

    console.log(resultsGetIndentitas);

    db.query(queryGetStatistik, (err, resultsGetStatistik) => {
      if (err) {
        console.log(err);
        return;
      }
      console.log(resultsGetStatistik);

      const querypemain = `INSERT INTO pemain(id_identitas, id_statistik, formasis) VALUES (${resultsGetIndentitas.rows[0].id_identitas}, ${resultsGetStatistik.rows[0].id_statistik}, '${req.body.formasis}');`;
      db.query(querypemain, (err, resultsPemain) => {
        if (err) {
          console.log(err);
          return;
        }
        console.log(resultsPemain);
      });
    });
  });
  res.end("player created successfully");
});

app.listen(8000, () => {
  console.log("Server Kelompok 7 berjalan");
});
