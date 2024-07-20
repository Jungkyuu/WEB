require("dotenv").config();
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    define: {
      timestamps: false,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

const Theme = sequelize.define("Theme", {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: Sequelize.STRING,
});

const Set = sequelize.define("Set", {
  set_num: { type: Sequelize.STRING, primaryKey: true },
  name: Sequelize.STRING,
  year: Sequelize.INTEGER,
  num_parts: Sequelize.INTEGER,
  theme_id: {
    type: Sequelize.INTEGER,
    references: { model: "Themes", key: "id" },
  },
  img_url: Sequelize.STRING,
});

Set.belongsTo(Theme, { foreignKey: "theme_id" });

function initialize() {
  return sequelize.sync();
}

function getAllSets() {
  return Set.findAll({ include: [Theme] });
}

async function getSetByNum(setNum) {
  return Set.findOne({
    where: { set_num: setNum },
  });
}

function getSetsByTheme(theme) {
  return Set.findAll({
    include: [
      { model: Theme, where: { name: { [Sequelize.Op.iLike]: `%${theme}%` } } },
    ],
  });
}

async function addSet(setData) {
  try {
    const newSet = await Set.create(setData);
    return newSet;
  } catch (err) {
    throw err;
  }
}
async function getAllThemes() {
  try {
    return await Theme.findAll();
  } catch (err) {
    throw err;
  }
}
async function editSet(set_num, setData) {
  try {
    const set = await Set.findOne({ where: { set_num: set_num } });
    if (set) {
      return await set.update(setData);
    } else {
      throw new Error("Set not found");
    }
  } catch (err) {
    throw err;
  }
}

const deleteSet = (set_num) => {
  return new Promise((resolve, reject) => {
    Set.destroy({
      where: { set_num: set_num },
    })
      .then((result) => {
        if (result === 0) {
          reject("No set found with that number.");
        } else {
          resolve();
        }
      })
      .catch((err) => reject(err.message));
  });
};

module.exports = {
  deleteSet,
  editSet,
  addSet,
  getAllThemes,
  initialize,
  getAllSets,
  getSetByNum,
  getSetsByTheme,
};
