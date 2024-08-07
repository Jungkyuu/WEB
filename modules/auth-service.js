require("dotenv").config();

const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  userName: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  loginHistory: [
    {
      dateTime: { type: Date, required: true },
      userAgent: { type: String, required: true },
    },
  ],
});

let User;

function initialize() {
  return new Promise((resolve, reject) => {
    // Create a new connection to the MongoDB
    const dbURI = process.env.MONGODB;
    if (!dbURI) {
      console.error("MongoDB connection URI is undefined");
      reject("MongoDB connection URI is undefined. Check your .env file.");
      return;
    }

    let db = mongoose.createConnection(process.env.MONGODB);

    // Handle connection errors
    db.on("error", (err) => {
      console.error("Connection error:", err);
      reject(err);
    });

    // Initialize the model once connected
    db.once("open", () => {
      console.log("Database connection successful");
      User = db.model("User", userSchema);
      resolve();
    });
  });
}

function registerUser(userData) {
  return new Promise((resolve, reject) => {
    // Check if passwords match
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    } else {
      // Hash the password using bcrypt
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          // Create a new user instance with the hashed password
          let newUser = new User({
            userName: userData.userName,
            password: hash, // Store the hashed password
            email: userData.email,
            loginHistory: [
              {
                dateTime: new Date(),
                userAgent: userData.userAgent,
              },
            ],
          });

          // Save the new user to the database
          newUser
            .save()
            .then(() => {
              resolve("Registration successful!");
            })
            .catch((err) => {
              if (err.code === 11000) {
                reject("User Name already taken");
              } else {
                reject(`There was an error creating the user: ${err}`);
              }
            });
        })
        .catch((err) => {
          reject("There was an error encrypting the password");
        });
    }
  });
}

function checkUser(userData) {
  return new Promise((resolve, reject) => {
    // Find the user by userName
    User.findOne({ userName: userData.userName })
      .exec()
      .then((user) => {
        if (!user) {
          // If no user is found, reject with a message
          reject(`Unable to find user: ${userData.userName}`);
        } else {
          // Compare the provided password with the hashed password stored in the database
          bcrypt
            .compare(userData.password, user.password)
            .then((result) => {
              if (result === false) {
                reject(`Incorrect Password for user: ${userData.userName}`);
              } else {
                // Manage login history
                if (user.loginHistory.length === 8) {
                  user.loginHistory.pop(); // Remove the oldest entry if there are 8 entries
                }
                // Add a new login history entry at the beginning
                user.loginHistory.unshift({
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent,
                });

                // Update the user's loginHistory in the database
                User.updateOne(
                  { userName: user.userName },
                  { $set: { loginHistory: user.loginHistory } }
                )
                  .exec()
                  .then(() => {
                    // Resolve the promise with the user's data
                    resolve(user);
                  })
                  .catch((err) => {
                    reject(`There was an error verifying the user: ${err}`);
                  });
              }
            })
            .catch((err) => {
              reject("There was an error comparing passwords");
            });
        }
      })
      .catch(() => {
        reject(`Unable to find user: ${userData.userName}`);
      });
  });
}

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

// Export the function along with the others
module.exports = {
  initialize,
  registerUser,
  checkUser,
  ensureLogin,
  User,
};
