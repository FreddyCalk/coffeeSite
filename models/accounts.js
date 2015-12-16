var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
	firstName: String,
	lastName: String,
	email: String,
	username: String,
	password: String,
	grind: String,
	unitQuantity: Number,
	frequency: String
})

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('account', Account)

