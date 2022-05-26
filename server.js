//import packages
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const { Pool } = require("pg");

const bcrypt = require("bcrypt");


app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
  credentials: true
}));

//middleware (session)S
app.use(
  session({
    key: "userId",
    secret: "a random unique string key used to authenticate a session.",
    saveUninitialized: false,
    resave: false,
    cookie: { expires: 60 * 60 * 24 },
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
var temp;

const db = new Pool({
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

// Register User
app.post("/register", (req, res) => {
  temp = req.session;
  temp.username = req.body.username;
  password = req.body.password;
  console.log(temp.username);
  console.log(password);

  // Use bcrypt.hash() function to hash the password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return err;
    }

    const query = `INSERT INTO users VALUES ('${temp.username}', '${hashedPassword}');`;
    db.query(query),
      (err, results) => {
        if (err) {
          console.log(err);
          alert("User dengan username/password tersebut sudah ada.");
          res.end("Gagal membuat user baru");
          return;
        }
        console.log(results.rows[0]);
        console.log("Data insert berhasil");
      };
  });
  res.end("user berhasil dibuat");
});

app.get("/login", (req, res) => {
  temp = req.session;
  console.log()
  res.send(req.session);
});

// Login
app.post("/login", (req, res) => {
  temp = req.session;
  temp.username = req.body.username;
  password = req.body.password;

  if (temp.username === "" || password === "") {
    console.log("Form login is empty. ");
    res.send("Empty login form");
    return;
  }

  const query = `SELECT password FROM users WHERE username LIKE '${temp.username}';`;
  db.query(query, (err, results) => {
    if (err) {
      alert("Login Failed");
      res.send("Login failed");
    }

    bcrypt.compare(password, results.rows[0].password, (err, isMatch) => {
      if (err) {
        res.send("failed");
      } else {

      }

      //If password matches then display true
      console.log(`Password Match = ${isMatch}.`);
    });
  });

  const queryId = `SELECT user_id FROM users WHERE username LIKE '${temp.username}';`;
  db.query(queryId, (err, results) => {
    if (err) {
      //alert("get ID failed");
      console.error(err.message);
      res.end("failed");
    } else if (results === null) {
      res.end("Can't find an associated account.");
    } else {
      console.log("MASUK SINI WOY");
      console.log(results);
      temp.user_id = results.rows[0].user_id;
    }
    console.log(`temp.user_id = ${temp.user_id}`);
    if (temp.user_id !== undefined) {
      const queryIdTim = `SELECT id_tim FROM tim WHERE user_id = '${req.session.user_id}';`;
      db.query(queryIdTim, (err, results_idTim) => {
        if (err) {
          //alert("get id tim failed")s;
          console.log("GAGAL QUERY ID TIM");
          console.error(err.message);
          res.end("Gagal queryIdTim");
        } else if (results_idTim.rows.length === 0) {
          // console.log(`results_idTim = '${results_idTim.rows[0].id_tim}'`);
          // temp.id_tim = results_idTim.rows[0].id_tim;
          // console.log(temp);
          console.log(results_idTim.rows);
          console.log(temp);
          res.end("Login berhasil (id_tim tidak ditemukan)");
        } else {
          console.log(`results_idTim = '${results_idTim.rows[0].id_tim}'`);
          temp.id_tim = results_idTim.rows[0].id_tim;
          console.log(temp);
          res.send(temp);
        }
      });
    }
  });
});

// Set Selected Player
app.put("/setSelectedPlayer", (req, res) => {
  temp = req.session;
  temp.teamID = req.body.teamID;
  temp.playerID = req.body.playerID;
  console.log(
    `Got player ${temp.playerID} from team ${req.session.id_tim} to select`
  );

  const query = `UPDATE pemain SET selected = NOT selected WHERE id_tim = '${req.session.id_tim}' AND id_pemain = '${temp.playerID}'`;
  db.query(query, (err, results) => {
    if (err) {
      alert("Set selected failed");
      res.end("failed to select");
    } else {
      console.log(results);
      res.send(results.rows);
    }
  });
});

app.get("/getSelectedPlayer", (req, res) => {
  temp = req.session;
  console.log(temp);
  //temp.teamID = req.body.teamID;
  console.log(
    `Getting all selected players from team ${req.session.id_tim} ...`
  );

  const query = `SELECT no_punggung, nama, posisi_pemain FROM pemain LEFT JOIN identitas ON pemain.id_identitas = identitas.id_identitas WHERE pemain.selected = 't' AND pemain.id_tim = '${req.session.id_tim}'; `;
  db.query(query, (err, results) => {
    if (err) {
      //alert("Get selected failed");
      res.end("failed to get selected player");
    } else {
      console.log(results.rows);
      res.send(results.rows);
    }
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

      const querypemain = `INSERT INTO pemain(id_identitas, id_statistik, id_tim, posisi_pemain) VALUES (${resultsGetIndentitas.rows[0].id_identitas}, ${resultsGetStatistik.rows[0].id_statistik}, '${req.body.formasis}');`;
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

// ROUTE CREATE TEAM
app.post("/createteam", (req, res) => {
  temp = req.session;
  console.log(temp);
  const query = `insert into tim (nama_tim, manager, formasis, user_id) values ('${req.body.nama_tim}','${req.body.manager}','${req.body.formasis}', '${temp.user_id}');`; //query tambahkan tim baru ke database
  db.query(query, (err, results) => {
    if (err) {
      console.log(err);
      res.end("fail");
    }
    console.log(results.rows);
    res.end("Team created successfully");
  });

  const queryId = `SELECT user_id FROM users WHERE username LIKE '${temp.username}';`;
  db.query(queryId, (err, resultsUserID) => {
    if (err) {
      //alert("get ID failed");
      res.end("failed");
    } else if (resultsUserID === null) {
      res.end("Can't find an associated account.");
    } else {
      console.log(resultsUserID);
      temp.user_id = resultsUserID.rows[0].user_id;
    }
    // console.log(`RESULTS = ${results}`)
    const queryIdTim = `SELECT id_tim FROM tim WHERE user_id = '${temp.user_id}';`;
    db.query(queryIdTim, (err, results_idTim) => {
      if (err) {
        //alert("get id tim failed")s;
        res.end("failed");
      }
      console.log(`results_idTim = '${results_idTim.rows[0].id_tim}'`);
      temp.id_tim = results_idTim.rows[0].id_tim;
      res.end("Login berhasil");
    });
  });
});

//router 5: melakukan pemngambilan data dari database
app.get("/getteam", (req, res) => {
  console.log("MULAI GET TEAM ---------------------");
  // console.log(req.session);

  const query = `select * from tim where user_id = ${req.session.user_id};`; // query ambil data
  //mendapatkan data dari database
  db.query(query, (err, results) => {
    if (err) {
      console.log(err);
      res.end("Failed to get team");
      return;
    } else {
      res.json(results.rows[0]);
    }
    // res.write(`<table>
    //               <tr>
    //                   <th>ID</th>
    //                   <th>Nama Team</th>
    //                   <th>Manager</th>
    //                   <th>Formasi</th>
    //               </tr>`);
    // for (row of results.rows) {
    //   res.write(`<tr>
    //                   <td>${row["id_tim"]}</td>
    //                   <td>${row["nama_tim"]}</td>
    //                   <td>${row["manager"]}</td>
    //                   <td>${row["formasis"]}</td>
    //               </tr>`);
    // }
    // res.end(`</table>`);
  });
});

app.get("/getPlayer", (req, res) => {
  const queryTim = `SELECT * FROM tim where TIM.user_id = ${req.session.user_id};`;
  db.query(queryTim, (err, resultsTim) => {
    if (err) {
      //alert("gagal euy");
      res.end("gagal ngambil data");
    }

    objectTim = resultsTim.rows[0];
    console.log(objectTim);
    const query = `SELECT * FROM pemain NATURAL JOIN tim NATURAL JOIN statistik NATURAL JOIN identitas WHERE pemain.id_tim = '${objectTim.id_tim}';`;
    db.query(query, (err, results) => {
      if (err) {
        //alert("Get player failed");
        res.end("Failed to get player");
      }
      console.log(results.rows);
      res.send(`query mengambil pemain berhasil ${results.rows}`);
    });
  });
});

app.put("/setFormation", (req, res) => {
  temp = req.session;
  temp.teamID = req.body.teamID;
  temp.playerID = req.body.playerID;
  temp.formation = req.body.formation;
  console.log(
    `Got formation ${temp.formation} from team ${temp.teamID} to select`
  );

  const query = `INSERT INTO tim (formasi) VALUES ('${temp.formation}')`;
  db.query(query, (err, results) => {
    if (err) {
      alert("Set formation failed");
      res.end("Failed to set formation");
    } else {
      console.log(results);
      res.send("Query set formasi berhasil");
    }
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.end("Already Logout");
      return console.error(err);
    }
    res.end("Logout success");
  });
});

app.listen(8000, () => {
  console.log("Server Kelompok 7 berjalan");
});
