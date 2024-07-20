const legoData = require("./modules/legoSets");
const path = require("path");

const express = require("express");
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

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
          .render("404", { message: "No sets found for the specified theme." });
      }
    } else {
      legoSets = await legoData.getAllSets();
    }
    console.log(legoSets);
    res.render("sets", { sets: legoSets });
  } catch (err) {
    res.status(500).render("500", { message: `Server error: ${err.message}` });
  }
});

app.get("/lego/addSet", async (req, res) => {
  try {
    const themes = await legoData.getAllThemes();
    res.render("addSet", { themes });
  } catch (err) {
    res.status(500).render("500", { message: err.message });
  }
});

app.post("/lego/addSet", async (req, res) => {
  try {
    await legoData.addSet(req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.status(500).render("500", { message: err.message });
  }
});

app.get("/lego/editSet/:num", async (req, res) => {
  try {
    const set = await legoData.getSetByNum(req.params.num);
    const themes = await legoData.getAllThemes();
    res.render("editSet", { set, themes });
  } catch (err) {
    res.status(404).render("404", { message: "Set not found" });
  }
});

app.get("/lego/sets/:num", async (req, res) => {
  try {
    let set = await legoData.getSetByNum(req.params.num);
    if (!set) {
      res.status(404).render("404", { message: "Set not found" });
      return;
    }
    res.render("set", { set });
  } catch (err) {
    res.status(500).render("500", { message: `Server error: ${err.message}` });
  }
});

app.post("/lego/editSet", async (req, res) => {
  try {
    await legoSets.editSet(req.body.set_num, req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.status(500).render("500", { message: `Error updating set` });
  }
});

app.get("/lego/deleteSet/:num", async (req, res) => {
  try {
    await legoSets.deleteSet(req.params.num);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error`,
    });
  }
});

app.use((req, res, next) => {
  res.status(404).render("404", {
    message: "I'm sorry, we're unable to find what you're looking for",
  });
});

legoData.initialize().then(() => {
  app.listen(HTTP_PORT, () => {
    console.log(`server listening on: ${HTTP_PORT}`);
  });
});
