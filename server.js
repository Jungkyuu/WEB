/********************************************************************************
 *  WEB322 – Assignment 04
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Jungkyu Mok Student ID: 161501226 Date: 2024.7.5
 *
 *  Published URL: ___________________________________________________________
 *
 ********************************************************************************/

const express = require("express");
const path = require("path");
const legoData = require("./modules/legoSets");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/lego/sets", async (req, res) => {
  try {
    let legoSets;
    if (req.query.theme) {
      legoSets = await legoData.getSetsByTheme(req.query.theme);
      if (legoSets.length === 0) {
        return res
          .status(404)
          .render("404", { message: "No Sets found for a matching theme " });
      }
    } else {
      legoSets = await legoData.getAllSets();
    }
    res.render("sets", { sets: legoSets });
  } catch (err) {
    res.status(404).render("404", { message: err.message });
  }
});

app.get("/lego/sets/:num", async (req, res) => {
  try {
    let legoSet = await legoData.getSetByNum(req.params.num);
    if (!legoSet) {
      return res
        .status(404)
        .render("404", { message: "No Sets found for a specific set num " });
    }
    res.render("set", { set: legoSet });
  } catch (err) {
    res.status(404).render("404", { message: err.message });
  }
});

app.use((req, res, next) => {
  res.status(404).render("404", {
    message: "No view matched for a specific route ",
  });
});

legoData.initialize().then(() => {
  app.listen(HTTP_PORT, () => {
    console.log(`server listening on: ${HTTP_PORT}`);
  });
});
