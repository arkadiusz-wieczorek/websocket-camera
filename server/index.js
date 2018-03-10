import express from "express";
const app = express();
const http = require("http").Server(app);

import passport from "passport";
import { Strategy } from "passport-twitter";

passport.use(
	new Strategy(
		{
			consumerKey: process.env.CONSUMER_KEY,
			consumerSecret: process.env.CONSUMER_SECRET,
			callbackURL:
				process.env.CALLBACK_URL !== undefined
					? process.env.CALLBACK_URL
					: "http://127.0.0.1:3000/login/twitter/return",
		},
		(token, tokenSecret, profile, callback) => callback(null, profile)
	)
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => {
	findUserByIdMock(user, done);
});
const findUserByIdMock = (user, done) => {
	if (process.env.USER_ID == user.id) done(null, user);
	else done(null, false);
};

const io = require("socket.io")(http, {
	pingTimeout: 100,
});

app.use(require("morgan")("combined"));
app.use(require("cookie-parser")());
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(
	require("express-session")({
		secret: "keyboard cat",
		resave: true,
		saveUninitialized: true,
	})
);

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => res.redirect("/stream"));
app.get("/login", (req, res) => res.sendFile(__dirname + "/index.html"));
app.get("/login/twitter", passport.authenticate("twitter"));
app.get(
	"/login/twitter/return",
	passport.authenticate("twitter", { failureRedirect: "/login" }),
	(req, res) => {
		res.redirect("/");
	}
);
app.get(
	"/stream",
	require("connect-ensure-login").ensureLoggedIn(),
	(req, res) => {
		res.sendFile(__dirname + "/stream.html");
	}
);

http.listen(3000, () => console.log("start server, listening on *:3000"));

io.on("connection", socket => {
	console.log("connected:", socket.client.id);

	socket.on("base64-image", base64 => {
		io.sockets.emit("live-stream", base64);
	});
});
