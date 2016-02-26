import express from 'express';
import bodyParser from 'body-parser';
import mongoose, { Schema } from 'mongoose';
import Promise from 'promise';

console.log("======== Users microservice starting ========");

const { API_PORT = 3290, MONGO_USERS_SERVICE_HOST = "localhost", MONGO_USERS_SERVICE_PORT = "27017" } = process.env;

const api = express();

let mongoConnectionUrl = "mongodb://" + MONGO_USERS_SERVICE_HOST + ":" + MONGO_USERS_SERVICE_PORT + "/users";

let mongoosePromise = new Promise((resolve, reject) => {
    mongoose.connect(mongoConnectionUrl);
    
    mongoose.connection.once("open", resolve.bind(this, mongoose.connection));
    mongoose.connection.on("error", reject); 
});

/* User schema */

const UserSchema = new Schema({
    name: {
        type: String,
        unique: true,
        validate: /^[a-z0-9]{3,}$/
    }
});

const User = mongoose.model('User', UserSchema);

/* REST API */

export const READ_ALL_USERS = "/";
export const READ_USER = "/:name";
export const CREATE_USER = "/";

api.use(bodyParser.json());

api.get(READ_ALL_USERS, function(req, res) {
    User.find().then(users => {
       res.send(users); 
    }, error => {
       res.status(500).end();
    });
});

api.get(READ_USER, function(req, res) {
    const { params } = req;
    const { name } = params;
    
    User.findOne({name}).then(user => {
		if(user)
			res.send(user);
		else
			res.status(404).end();
    }, error => {
		res.status(500).end();
    });
});

api.post(CREATE_USER, function(req, res) {
	const user = new User(req.body);
	
	user.save().then(() => {
		res.end();
	}, error => {
		res.status(400).send(error);
	});
});

mongoosePromise.then(database => {
    api.listen(API_PORT, console.log.bind(console, "Listening.."));
}, error => {
    console.error("MongoDB error", error);
    process.exit(1);  
});
