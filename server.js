/********************************************************************************
 *  WEB322 – Assignment 06
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Jungkyu Mok Student ID: 161501226 Date: 2024.8.6
 *
 *  Published URL: https://web6-i6fk-jungkyuus-projects.vercel.app/
 *
 ********************************************************************************/

const express = require("express");
const path = require("path");
const legoData = require("./modules/legoSets");
const Sequelize = require("sequelize");

const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));

app.use(
  clientSessions({
    cookieName: "session",
    secret: "o6LjQ5EVNC28ZgK64hDELM18ScpFQr",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/lego/addSet", async (req, res) => {
  try {
    let themes = await legoData.getAllThemes();
    res.render("addSet", { themes: themes });
  } catch (err) {
    res.status(500).render("500", { message: `Error fetching themes: ${err}` });
  }
});

app.post("/lego/addSet", authData.ensureLogin, async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).render("500", {
      message: "No data provided for the LEGO set.",
    });
  }

  try {
    await legoData.addSet(req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.status(500).render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/lego/editSet/:num", async (req, res) => {
  try {
    let set = await legoData.getSetByNum(req.params.num);
    let themes = await legoData.getAllThemes();
    res.render("editSet", { set, themes });
  } catch (err) {
    res
      .status(500)
      .render("500", { message: `Error fetching set or themes: ${err}` });
  }
});

app.post("/lego/editSet", authData.ensureLogin, async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).render("500", {
      message: "No data provided for editing the LEGO set.",
    });
  }

  try {
    await legoData.editSet(req.body.set_num, req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.status(500).render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/lego/deleteSet/:num", authData.ensureLogin, async (req, res) => {
  try {
    await legoData.deleteSet(req.params.num);
    res.redirect("/lego/sets");
  } catch (err) {
    res.status(500).render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/lego/sets", async (req, res) => {
  let sets = [];

  try {
    if (req.query.theme) {
      sets = await legoData.getSetsByTheme(req.query.theme);
    } else {
      sets = await legoData.getAllSets();
    }

    res.render("sets", { sets });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.get("/lego/sets/:num", async (req, res) => {
  try {
    let set = await legoData.getSetByNum(req.params.num);
    res.render("set", { set });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { errorMessage: req.session.errorMessage });
});

app.get("/register", (req, res) => {
  res.render("register", {
    successMessage: req.session.successMessage || "",
    errorMessage: req.session.errorMessage || "",
  });
});

app.post("/register", async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).render("register", {
      errorMessage: "No data provided for registration.",
      userName: req.body.userName,
    });
  }

  req.body.userAgent = req.get("User-Agent");

  try {
    const successMessage = await authData.registerUser(req.body);
    res.render("register", {
      successMessage: successMessage,
      userName: req.body.userName,
    });
  } catch (err) {
    res.status(500).render("register", {
      errorMessage: err,
      userName: req.body.userName,
    });
  }
});

app.post("/login", async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).render("login", {
      errorMessage: "No data provided for login.",
      userName: req.body.userName,
    });
  }

  req.body.userAgent = req.get("User-Agent");

  try {
    const user = await authData.checkUser(req.body);
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory,
    };
    res.redirect("/lego/sets");
  } catch (err) {
    res
      .status(500)
      .render("login", { errorMessage: err, userName: req.body.userName });
  }
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", authData.ensureLogin, (req, res) => {
  res.render("userHistory");
});

legoData
  .initialize()
  .then(authData.initialize)
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log(`app listening on: ${HTTP_PORT}`);
    });
  })
  .catch(function (err) {
    console.log(`unable to start server: ${err}`);
  });

app.use((req, res, next) => {
  res.status(404).render("404", {
    message: "I'm sorry, we're unable to find what you're looking for",
  });
});
