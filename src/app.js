/* REQUIRES */
require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const app = express();

/* Middleware */
app.use(express.urlencoded({ extended: false }));
app.use(logger("dev"));
app.use(express.json());

/* Routers */
const productsRouter = require("./routes/products");
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const { sendJsonError } = require("./helpers/sendJsonError");

/* Routes */
app.use("/products", productsRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);

// ************ DON'T TOUCH FROM HERE ************
// ************ catch 404 and forward to error handler ************
//app.use((req, res, next) => res.status(404).json({ error: "404 Not found" }));

// ************ error handler ************
app.use((err,req,res,next) => {
    sendJsonError(err,res)
})

module.exports = app;
