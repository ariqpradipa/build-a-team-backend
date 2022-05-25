//import packages
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const { Pool } = require("pg");

const bcrypt = require("bcrypt");

// var corsOptions = {
//   origin: "http://localhost:8081"
// };
app.use(cors());
//middleware (session)
app.use(session({

  secret: "ini contoh secret",
  saveUninitialized: false,
  resave: false,

}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({

  extended: true,

}));

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

  inputUsername = req.body.username;
  inputPassword = req.body.password;

  // Use bcrypt.hash() function to hash the password
  bcrypt.hash(inputPassword, 10, (err, hashedPassword) => {
    if (err) {

      res.end("User gagal ditambahkan");
      return err;

    }

    const query = `INSERT INTO users VALUES ('${inputPassword}', '${hashedPassword}');`;
    db.query(query), (err, results) => {
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

// Login
app.post("/login", (req, res) => {

  temp = req.session;
  temp.username = req.body.username;
  inputPassword = req.body.password;

  if (temp.username === "" || temp.password === "") {

    console.log("Form login is empty. ");
    res.send("Empty login form");

    return;

  }

  const query = `SELECT password FROM users WHERE username LIKE '${temp.username}';`;
  db.query(query, (err, results) => {

    if (err) {

      alert("Login Failed");
      res.end("failed");

    }

    temp.password = results.rows[0].password;

    bcrypt.compare(temp.password, results.rows[0].password, (err, isMatch) => {

      if (err) {

        res.send("failed");

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
          res.end("Login berhasil");

        }
      });
    };
  });
});

// Set Selected Player
app.put("/setselectedplayer", (req, res) => {

  playerID = req.body.playerID;
  console.log(`Got player ${playerID} from team ${req.session.id_tim} to select`);

  const query = `UPDATE pemain SET selected = true WHERE id_tim = '${req.session.id_tim}' AND id_pemain = '${playerID}'`;
  db.query(query, (err, results) => {

    if (err) {

      alert("Set selected failed");
      res.end("failed to select");

    } else {

      console.log(results);
      res.send("query select pemain berhasil");

    }
  });
});

// Unset Selected Player
app.put("/unsetselectedplayer", (req, res) => {

  playerID = req.body.playerID;

  const query = `UPDATE pemain SET selected = false WHERE id_tim = '${req.session.id_tim}' AND id_pemain = '${playerID}'`;
  db.query(query, (err, results) => {

    if (err) {

      console.log(err);
      res.end("failed to unselect");

    }

    console.log(results);
    res.end("query unset pemain berhasil");

  });
});


app.get("/getselectedplayer", (req, res) => {

  if(req.session.id_tim === undefined) {

    res.end("Team not created yet");
    return;

  }

  console.log(`Getting all selected players from team ${req.session.id_tim} ...`);

  const query = `SELECT no_punggung, nama, posisi_pemain FROM pemain LEFT JOIN identitas ON pemain.id_identitas = identitas.id_identitas WHERE pemain.selected = 't' AND pemain.id_tim = '${req.session.id_tim}'; `;
  db.query(query, (err, results) => {

    if (err) {

      //alert("Get selected failed");
      res.end("failed to get selected player");

    } else {

      console.log(results.rows);
      res.send(`query selected pemain berhasil ${results.rows}`);

    }
  });
});

app.post("/createplayer", (req, res) => {

  inputNama = req.body.nama;
  inputUmur = req.body.umur;
  inputNo_punggung = req.body.no_punggung;
  inputTinggi = req.body.tinggi;
  inputBeratBadan = req.body.berat_badan;

  inputAgility = req.body.agility;
  inputDefence = req.body.defence;
  inputShooting = req.body.shooting;
  inputSpeed = req.body.speed;
  inputPassing = req.body.passing;
  inputStamina = req.body.stamina;
  inputDribbling = req.body.dribbling;
  
  inputPosisi = req.body.posisi;

  const queryIdentitas = `INSERT INTO identitas(nama, umur, no_punggung, tinggi, berat_badan) VALUES ('${inputNama}', ${inputUmur}, ${inputNo_punggung}, ${inputTinggi}, ${inputBeratBadan});`;
  const queryStatistik = `INSERT INTO statistik(agility, defence, shooting, speed, passing, stamina, dribbling) VALUES ('${inputAgility}', '${inputDefence}', '${inputShooting}', '${inputSpeed}', '${inputPassing}', '${inputStamina}', '${inputDribbling}');`;

  db.query(queryIdentitas, (err, resultsIdentitas) => {

    if (err) {

      console.log(err);
      res.end("player created failed (identitas)");

      return;

    }

    console.log(resultsIdentitas.rows[0]);

  });
  db.query(queryStatistik, (err, resultsStatistik) => {

    if (err) {

      console.log(err);
      res.end("player created failed (statistik)");

      return;

    }

    console.log(resultsStatistik.rows[0]);

  });

  const queryGetIndentitas = `SELECT * FROM identitas ORDER BY id_identitas DESC LIMIT 1;`;
  const queryGetStatistik = `SELECT * FROM statistik ORDER BY id_statistik DESC LIMIT 1;`;
  db.query(queryGetIndentitas, (err, resultsGetIndentitas) => {

    if (err) {

      console.log(err);
      res.end("player created failed (get id identitas)");

      return;

    }

    console.log(resultsGetIndentitas.rows[0]);

    db.query(queryGetStatistik, (err, resultsGetStatistik) => {

      if (err) {

        console.log(err);
        res.end("player created failed (get id statistik)");

        return;

      }
      console.log(resultsGetStatistik.rows[0]);

      const querypemain = `INSERT INTO pemain(id_identitas, id_statistik, id_tim, posisi_pemain) VALUES (${resultsGetIndentitas.rows[0].id_identitas}, ${resultsGetStatistik.rows[0].id_statistik}, ${req.session.id_tim},'${inputPosisi}');`;
      db.query(querypemain, (err, resultsPemain) => {

        if (err) {

          console.log(err);
          res.end("player created failed (pemain)");

          return;

        }

        res.end("player created successfully");
        console.log(resultsPemain.rows[0]);
        return;

      });
    });
  });

  res.end("player created failed");

});

//get player
app.get("/getplayer", (req, res) => {

  const queryTim = `SELECT * FROM tim where tim.user_id = ${req.session.user_id};`;
  db.query(queryTim, (err, resultsTim) => {

    if (err) {

      alert("gagal mengambil data player");
      res.end("gagal ngambil data");
      return;

    }

    objectTim = resultsTim.rows[0];
    console.log(objectTim);

    const query = `SELECT * FROM pemain NATURAL JOIN tim NATURAL JOIN statistik NATURAL JOIN identitas WHERE pemain.id_tim = '${objectTim.id_tim}';`;
    db.query(query, (err, results) => {

      if (err) {

        alert("Get player failed");
        res.end("Failed to get player");

      }
      console.log(results.rows);
      res.send(`query mengambil pemain berhasil ${results.rows}`);

    });
  });
});

// ROUTE CREATE TEAM
app.post("/createteam", (req, res) => {

  temp = req.session;
  inputNamaTim = req.body.nama_tim;
  inputManager = req.body.manager;
  inputFormasis = req.body.formasis;

  //query tambahkan tim baru ke database
  const query = `insert into tim (nama_tim, manager, formasis, user_id) values ('${inputNamaTim}','${inputManager}','${inputFormasis}', '${req.session.user_id}');`; 
  db.query(query, (err, results) => {

    if (err) {

      console.log(err);
      res.end("fail");

    }

    console.log(results.rows)
    res.end("Team created successfully");

  });

  const queryId = `SELECT user_id FROM users WHERE username LIKE '${req.session.username}';`;
  db.query(queryId, (err, resultsUserID) => {

    if (err) {

      alert("get ID failed");
      res.end("failed");

    } else if (resultsUserID === null) {

      res.end("Can't find an associated account.");

    } else {

      console.log(resultsUserID)
      temp.user_id = resultsUserID.rows[0].user_id;

    }
    // console.log(`RESULTS = ${results}`)
    const queryIdTim = `SELECT id_tim FROM tim WHERE user_id = '${req.session.user_id}';`;
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

  console.log(req.session);
  const query = `select * from tim where user_id = ${req.session.user_id};`; // query ambil data
  //mendapatkan data dari database
  db.query(query, (err, results) => {

    if (err) {

      console.log(err);
      res.end("Failed to get team");

      return;

    } else {

      res.json(results.rows[0])

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

app.put("/setformation", (req, res) => {

  temp = req.session;
  temp.teamID = req.body.teamID;
  temp.playerID = req.body.playerID;
  temp.formation = req.body.formation;
  console.log(`Got formation ${temp.formation} from team ${temp.teamID} to select`);

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
