//import packages
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const { Pool } = require("pg");

const bcrypt = require("bcrypt");

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
    credentials: true,
  })
);

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

app.use(bodyParser.json());
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
  inputUsername = req.body.username;
  inputPassword = req.body.password;

  // Use bcrypt.hash() function to hash the password
  bcrypt.hash(inputPassword, 10, (err, hashedPassword) => {
    if (err) {
      res.end("User gagal ditambahkan");
      return err;
    }

    const query = `INSERT INTO users VALUES ('${inputUsername}', '${hashedPassword}');`;
    db.query(query),
      (err, results) => {
        if (err) {
          console.log(err);
          console.log("User dengan username/password tersebut sudah ada.");
          res.end("Gagal membuat user baru");

          return;
        }

        console.log(results.rows[0]);
        console.log("Data insert berhasil");
      };
  });

  res.end("user berhasil dibuat");
});

// GET /login untuk ngambil data session
app.get("/login", (req, res) => {
  temp = req.session;
  console.log();
  res.send(req.session);
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
    if (err || results.rows[0] == undefined) {
      console.log("No associated account is found.");
      res.end("No associated account is found.");
      return;
    } else {

      bcrypt.compare(inputPassword, results.rows[0].password, (err, isMatch) => {
        if (err) {
          res.end("failed");
          return;
        }
  
        if (!isMatch) {
          res.end("Password is not match");
          return;
        }
  
        //If password matches then display true
        console.log(`Password Match = ${isMatch}.`);
      });
    }

  });

  const queryId = `SELECT user_id FROM users WHERE username LIKE '${temp.username}';`;
  db.query(queryId, (err, results) => {
    if (err) {
      //console.log("get ID failed");
      console.error(err.message);
      res.end("failed");
      return;
    } else if (results.rows[0] == undefined) {
      res.end("Can't find an associated account.");
      return;
    } else {
      console.log("MASUK SINI WOY");
      //console.log(results);
      temp.user_id = results.rows[0].user_id;
    }

    console.log(`temp.user_id = ${temp.user_id}`);
    if (temp.user_id !== undefined) {
      const queryIdTim = `SELECT id_tim FROM tim WHERE user_id = '${req.session.user_id}';`;
      db.query(queryIdTim, (err, results_idTim) => {
        if (err) {
          //console.log("get id tim failed")s;
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
app.put("/setselectedplayer", (req, res) => {
  console.log("MASUK SET SELECTED PLAYER");

  // body
  arrayPlayerID = req.body.playerID;
  teamID = req.body.id_tim;

  console.log(arrayPlayerID);

  for (let i = 0; i < arrayPlayerID.length; i++) {
    console.log(
      `Got player ${arrayPlayerID[i]} from team ${teamID} to select`
    );
    const query = `UPDATE pemain SET selected = true WHERE id_tim = '${teamID}' AND id_pemain = '${arrayPlayerID[i]}'`;
    db.query(query, (err, results) => {
      if (err) {
        console.log("Set selected failed");
        res.end("failed to select");
      } else {
        console.log(results);
        res.send("query select pemain berhasil");
      }
    });
  }
});

// Unset Selected Player
app.put("/unsetselectedplayer", (req, res) => {
    // body
    arrayPlayerID = req.body.playerID;
    teamID = req.body.id_tim;
  
    console.log(arrayPlayerID);
  
    for (let i = 0; i < arrayPlayerID.length; i++) {
      console.log(
        `Got player ${arrayPlayerID[i]} from team ${teamID} to select`
      );
      const query = `UPDATE pemain SET selected = false WHERE id_tim = '${teamID}' AND id_pemain = '${arrayPlayerID[i]}'`;
      db.query(query, (err, results) => {
        if (err) {
          console.log("failed to unselect");
          res.end("failed to select");
        } else {
          console.log(results);
          res.send("query unselect pemain berhasil");
        }
      });
    }
});

app.get("/getselectedplayer", (req, res) => {
  if (req.session.id_tim === undefined) {
    res.end("Team not created yet");
    return;
  }

  console.log(
    `Getting all selected players from team ${req.session.id_tim} ...`
  );

  const query = `SELECT no_punggung, nama, posisi_pemain FROM pemain LEFT JOIN identitas ON pemain.id_identitas = identitas.id_identitas WHERE pemain.selected = 't' AND pemain.id_tim = '${req.session.id_tim}'; `;
  db.query(query, (err, results) => {
    if (err) {
      //console.log("Get selected failed");
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
  inputIDtim = req.body.id_tim;
  console.log("INI ISI REQ.BODY DI BAWAH");
  console.log(req.body);
  console.log("INI ISI SESSION DI BAWAH");
  console.log(req.session);

  // if (req.session.username == undefined) {
  //   res.end("Not logged in yet");
  //   return;
  // }

  const queryIdentitas = `INSERT INTO identitas(nama, umur, no_punggung, tinggi, berat_badan) VALUES ('${inputNama}', ${inputUmur}, ${inputNo_punggung}, ${inputTinggi}, ${inputBeratBadan});`;
  const queryStatistik = `INSERT INTO statistik(agility, defence, shooting, speed, passing, stamina, dribbling) VALUES ('${inputAgility}', '${inputDefence}', '${inputShooting}', '${inputSpeed}', '${inputPassing}', '${inputStamina}', '${inputDribbling}');`;

  db.query(queryIdentitas, (err, resultsIdentitas) => {
    if (err) {
      console.error(err);
      res.end("player created failed (identitas)");

      return;
    } else {
      console.log("query identitas berhasil");
    }
  });
  db.query(queryStatistik, (err, resultsStatistik) => {
    if (err) {
      console.error(err);
      res.end("player created failed (statistik)");

      return;
    } else {
      console.log("query statistik berhasil");
    }
  });

  setTimeout(function () {
    const queryGetIndentitas = `SELECT * FROM identitas ORDER BY id_identitas DESC LIMIT 1;`;
    const queryGetStatistik = `SELECT * FROM statistik ORDER BY id_statistik DESC LIMIT 1;`;
    db.query(queryGetIndentitas, (err, resultsGetIndentitas) => {
      if (err) {
        console.error(err);
        res.end("player created failed (get id identitas)");

        return;
      }

      console.log(resultsGetIndentitas.rows[0]);

      db.query(queryGetStatistik, (err, resultsGetStatistik) => {
        if (err) {
          console.error(err);
          res.end("player created failed (get id statistik)");

          return;
        }
        console.log(resultsGetStatistik.rows[0]);
        console.log("NIH DI BAWAH YG DIMASUKIN KE QUERYPEMAIN");
        console.log(resultsGetIndentitas.rows[0].id_identitas);
        console.log(resultsGetStatistik.rows[0].id_statistik);
        console.log(inputIDtim);
        console.log(inputPosisi);
        const querypemain = `INSERT INTO pemain(id_identitas, id_statistik, id_tim, posisi_pemain) VALUES ('${resultsGetIndentitas.rows[0].id_identitas}', '${resultsGetStatistik.rows[0].id_statistik}', '${inputIDtim}','${inputPosisi}');`;
        db.query(querypemain, (err, resultsPemain) => {
          if (err) {
            console.error(err);
            res.end("player created failed (pemain)");

            return;
          } else {
            console.log(resultsPemain);
            res.end("player created successfully");
          }

          return;
        });
      });
    });
  }, 2000);
});

//get player
app.get("/getplayer", (req, res) => {
  console.log("MULAI GET PLAYER");
  //  userId = req.session.user_id;
  //userId = req.session.user_id;
  user_id = req.query.user_id;
  console.log("DI BAWAH USER ID DARI REACT SESSION");
  console.log(user_id);

  const queryTim = `SELECT * FROM tim where tim.user_id = ${user_id};`;
  db.query(queryTim, (err, resultsTim) => {
    if (err) {
      console.log("gagal mengambil data player");
      //console.log(resultsTim);
      res.end("gagal ngambil data");
      return;
    } else {
      console.log("berhasil queryTim");
      objectTim = resultsTim.rows[0];
      //console.log(resultsTim);
    }

    const query = `SELECT * FROM pemain NATURAL JOIN tim NATURAL JOIN statistik NATURAL JOIN identitas WHERE pemain.id_tim = '${objectTim.id_tim}';`;
    db.query(query, (err, results) => {
      if (err) {
        console.log("Get player failed");
        res.end("Failed to get player");
      } else {
        console.log(results.rows);
        res.send(results.rows);
      }
    });
  });
});

//delete player
app.post("/deleteplayer", (req, res) => {
  console.log("MULAI DELETE PLAYER");
  id_pemain = req.body.id_pemain;

  const query = `DELETE FROM pemain WHERE id_pemain = '${id_pemain}';`;
  db.query(query, (err, results) => {
    if (err) {
      console.log("Delete player failed");
      res.end("Failed to delete player");
      return;
    }

    console.log("player deleted successfully");
    res.end("player deleted successfully");

  });
});

// update statistik pemain
app.put("/updatestatistikplayer", (req, res) => {
  
  id_pemain = req.body.id_pemain;
  inputAgility = req.body.agility;
  inputDefence = req.body.defence;
  inputShooting = req.body.shooting;
  inputSpeed = req.body.speed;
  inputPassing = req.body.passing;
  inputStamina = req.body.stamina;
  inputDribbling = req.body.dribbling;

  const query = `UPDATE statistik SET agility = '${inputAgility}', defence = '${inputDefence}', shooting = '${inputShooting}', speed = '${inputSpeed}', passing = '${inputPassing}', stamina = '${inputStamina}', dribbling = '${inputDribbling}' WHERE id_pemain = '${id_pemain}';`;
  db.query(query, (err, results) => {
    if (err) {
      console.log("Update statistik player failed");
      res.end("Failed to update statistik player");
      return;
    }

    console.log("statistik player updated successfully");
    res.end("statistik player updated successfully");
  })
});


// ROUTE CREATE TEAM
app.post("/createteam", (req, res) => {
  console.log("MASUK CREATE TEAM");

  temp = req.session;
  console.log(temp);
  inputNamaTim = req.body.nama_tim;
  inputManager = req.body.manager;
  inputFormasis = req.body.formasis;
  inputUserID = req.body.user_id;

  //query tambahkan tim baru ke database
  const query = `insert into tim (nama_tim, manager, formasis, user_id) values ('${inputNamaTim}','${inputManager}','${inputFormasis}', '${inputUserID}');`;
  db.query(query, (err, results) => {
    if (err) {
      console.log("QUERY BIKIN TIM GAGAL");
      console.error(err);
      res.end("fail");
    } else {
      console.log("BERHASIL BIKIN TIM");
      console.log(results);
      res.send(results);
    }
  });

  // const queryId = `SELECT user_id FROM users WHERE username LIKE '${req.session.username}';`;
  // db.query(queryId, (err, resultsUserID) => {
  //   if (err) {
  //     console.log("get ID failed");
  //     res.end("failed");
  //   } else if (resultsUserID === null) {
  //     res.end("Can't find an associated account.");
  //   } else {
  //     console.log(resultsUserID);
  //     temp.user_id = resultsUserID.rows[0].user_id;
  //     console.log(temp);
  //   }
  //   // console.log(`RESULTS = ${results}`)
  //   const queryIdTim = `SELECT id_tim FROM tim WHERE user_id = '${temp.user_id}';`;
  //   db.query(queryIdTim, (err, results_idTim) => {
  //     if (err) {
  //       console.log("get id tim failed");
  //       res.end("failed");
  //     } else {
  //       console.log(results_idTim);
  //       // console.log(`results_idTim = '${results_idTim.rows[0].id_tim}'`);
  //       temp.id_tim = results_idTim.rows[0].id_tim;
  //       console.log(temp);
  //       res.end("Login berhasil");
  //     }
  //   });
  // });
  console.log("DAH KELAR BIKIN TIM NYA");
});

//router 5: melakukan pemngambilan data dari database
app.get("/getteam", (req, res) => {
  userId = req.session.user_id;

  const query = `select * from tim where user_id = ${userId};`; // query ambil data
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

app.put("/setformation", (req, res) => {
  inputFormasi = req.body.formasis;
  sessionId_tim = req.session.id_tim;

  console.log(
    `Got formation ${inputFormasi} from team ${sessionId_tim} to select`
  );

  const query = `UPDATE tim SET formasis = ${inputFormasi} WHERE id_tim = ${sessionId_tim};`;
  db.query(query, (err, results) => {
    if (err) {
      console.log("Set formation failed");
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
