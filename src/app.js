import express from 'express';
import bodyParser from 'body-parser';
import mongoose, { Schema } from 'mongoose';
import Promise from 'promise';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

const { port = 80, db: dbUrl = "mongodb://localhost", verbose = false } = argv;

const api = express();

console.log("Connecting to %s", dbUrl);
mongoose.connect(dbUrl);

mongoose.connection.on("open", () => {
    console.log("Connected to %s", dbUrl);
    
    console.log("Listening to port %s", port);
    api.listen(port);
});

/* User schema */

const UserSchema = new Schema({
    name: {
        type: String,
        unique: true,
        validate: /^[a-z0-9]{3,}$/
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', UserSchema);

/* REST API */

api.use(bodyParser.json());

api.get("/", function(req, res) {
    const { name } = req.query;
    
    User.findOne({name}).then(user => {
		if(user)
			res.send(user);
		else
			res.status(404).end();
    }, error => {
		res.status(500).send(error);
    });
});

api.post("/", function(req, res) {
    const { name, password } = req.body;
	const user = new User({name, password});
	
	user.save().then(() => {
		res.end();
	}, error => {
		res.status(500).send(error);
	});
});

function exitOnSignal(signal) {
	process.on(signal, function() {
		console.log("Shutting down.. (%s)", signal);
		
		process.exit(0);
	});
}

exitOnSignal("SIGTERM");
exitOnSignal("SIGINT");