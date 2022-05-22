//import packages
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");

//initialize the app as an express app
const app = express();
const router = express.Router();
const { Client } = require("pg");
const bcrypt = require("bcrypt");

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
          console.log("errorrrr22");

          console.log(err);
          return;
        }
        console.log(results);
        console.log("Data insert berhasil") ;
      };
  });
  res.end("user berhasil dibuat");  
});

app.post("/insert", (req, res) => {
  db.query(
    `insert into mahasiswa values ('${req.body.npm}', '${req.body.nama}', '${req.body.universitas}', '${req.body.jurusan}')`,
    (err) => {
      if (err) {
        console.log(err);
        return;
      }

      res.send(
        `NPM ${req.body.npm}, nama ${req.body.nama}, universitas ${req.body.universitas}, jurusan ${req.body.jurusan} berhasil dimasukkan`
      );
    }
  );
});

app.put("/update", (req, res) => {
  db.query(
    `update mahasiswa set nama = '${req.body.nama}', universitas = '${req.body.universitas}', jurusan = '${req.body.jurusan}' where npm = ${req.body.npm}`,
    (err) => {
      if (err) {
        console.log(err);
        return;
      }
      res.send(`data mahasiswa dengan NPM ${req.body.npm} berhasil di update.`);
    }
  );
});

app.delete("/delete", (req, res) => {
  db.query(`delete from mahasiswa where npm = ${req.body.npm}`, (err) => {
    if (err) {
      console.log(err);
      res.send(err);
      return;
    }
    res.send(`Data mahasiswa dengan npm '${req.body.npm}' berhasil di delete`);
  });
});

app.get("/getOne", (req, res) => {
  db.query(
    `select * from mahasiswa where npm = '${req.body.npm}'`,
    (err, results) => {
      if (err) {
        console.log(err);
        return;
      }

      res.send(results.rows);
    }
  );
});
app.listen(8000, () => {
  console.log("Server Kelompok 7 berjalan");
});
