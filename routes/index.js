var express = require('express');
var passport = require('passport');
var Account = require('../models/accounts');
var router = express.Router();
var nodeMailer = require('nodemailer')
var vars = require('../config/vars.json');
var stripe = require('stripe')("sk_test_HI3dHwOVFKZBk3MKVeAOBATe");
/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { username: req.session.username});
});

router.get('/logout', function (req, res, next){
	req.session.destroy();
	res.redirect('/')
})

router.get('/register', function (req, res, next){
	res.render('register',{err : false, passErr : false, username: "",
						firstName: "", lastName: "", email: "" })
})

router.post('/register', function (req, res, next){
	
	if((req.body.password === req.body.passwordConfirm)&&(req.body.password.length >= 7)){
		Account.register(new Account(
				{firstName: req.body.firstName,
				lastName: req.body.lastName,
				email: req.body.email,
				username: req.body.username}),
				req.body.password,
			function (err, account){
				if(err){
					return res.render('register', {err: "That username is already in use", passErr: false, username: "",
						firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email })
				}
					passport.authenticate('local') (req, res, function (){
						req.session.username = req.body.username;
						res.redirect('/choices')
				})
			}
		)
	}else if(req.body.password !== req.body.passwordConfirm){
		var message = 'Your Passwords did not match';
		res.render('register', {err: false, passErr: message, username: req.body.username,
						firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email });
	}else if(req.body.password.length < 7){
		var message = 'Your password must be at least 7 characters long';
		res.render('register', {err: false, passErr: message, username: req.body.username,
						firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email });
	}
})

router.get('/login', function (req, res, next){
	if(req.session.username){
		res.redirect('/choices');
	}

	if(req.query.failedLogin){
		res.render('login', {error: true})
	}

	res.render('login', {error:false, username: false})
})

router.post('/login', function (req, res, next) {
     passport.authenticate('local', function (err, user, info) {

        if (err) {
          return next(err); // will generate a 500 error
        }
        // Generate a JSON response reflecting authentication status
        if (!user) {
          return res.render('login',{error:true, username:false});
        }
        if (user){
            // Passport session setup.
            passport.serializeUser(function (user, done) {
              done(null, user);
            });

            passport.deserializeUser(function (obj, done) {
              done(null, obj);
            });        
            req.session.username = user.username;
        }

        return res.redirect('/choices');
      })(req, res);
})

router.get('/choices', function (req, res, next){

	if(req.session.username){
		// They do belong here, proceed with page.
		// check and see if they have any set preferences already
		Account.findOne({username: req.session.username}, function (err, doc){
			var currGrind = doc.grind ? doc.grind : undefined;
			var currFrequency = doc.frequency ? doc.frequency : undefined;
			var currUnitQuantity = doc.unitQuantity ? doc.unitQuantity : undefined;
			res.render('choices', {username: req.session.username, grind: currGrind, frequency: currFrequency, quantity: currUnitQuantity});
		})
		// render the choices view
		
	}else{
		res.redirect('/');
	}
})

router.post('/choices', function (req, res, next){
	
	if(req.session.username){
		var newGrind = req.body.grind;
		var newFrequency = req.body.frequency;
		var newUnitQuantity = req.body.unitQuantity;

		Account.findOneAndUpdate(
			{ username: req.session.username },
			{ grind: newGrind,
			  frequency: newFrequency,
			  unitQuantity: newUnitQuantity
			},
			{ upsert: true },
			function (err, account){
				if(err){
					res.send("There was an error saving your preferences. Please re-enter or send this error to our help team: "+ err);
				}else{
					account.save;
				}
		})
		res.redirect('/delivery')
	}else{
		res.redirect('/')
	}
})

router.get('/delivery', function (req, res, next){
	if(req.session.username){
		Account.findOne({username : req.session.username},
			function (err, doc){
				var currName = doc.fullName ? doc.fullName : undefined;
				var currAddress1 = doc.address1 ? doc.address1 : undefined;
				var currAddress2 = doc.address2 ? doc.address2 : undefined;
				var currCity = doc.city ? doc.city : undefined;
				var currState = doc.state ? doc.state : undefined;
				var currZip = doc.zip ? doc.zip : undefined;
				res.render('delivery',{username: req.session.username, fullName : currName,
			address1:currAddress1,address2:currAddress2,city:currCity,state:currState,zip:currZip})
			})

	}else{
		res.redirect('/');
	}
})

router.post('/delivery',function (req, res, next){
	if(req.session.username){
		var address1 = req.body.address1;
		var address2 = req.body.address2;
		var fullName = req.body.fullName;
		var city = req.body.city;
		var state = req.body.state;
		var zip = req.body.zip;
		var date = req.body.vote;

		Account.findOneAndUpdate(
			{ username: req.session.username },
			{ address1: address1,
			  address2: address2,
			  fullName: fullName,
			  city: city,
			  state: state,
			  zip: zip,
			  date: date
			},
			{ upsert: true},
			function (err, account){

				if(err){
					return res.send("there was an error saving your preferences. Please re-enter or send this error to our help team: "+err)
				}else{
					account.save;
				}
				res.render('deliveryConfirm',{grind: account.grind, frequency: account.frequency, quantity: account.unitQuantity, username: req.session.username, address1: address1, address2: address2, fullName: fullName, city: city, state: state, zip: zip, date: date})
			});
		

	}else{
		res.redirect('/')
	}
})

router.get('/payment', function (req, res, next){
	Account.findOne({username: req.session.username}, function (err, account){
		console.log(account)
		res.render('payment',{grind: account.grind, frequency: account.frequency, quantity: account.unitQuantity, username: req.session.username, address1: account.address1, address2: account.address2, fullName: account.fullName, city: account.city, state: account.state, zip: account.zip, date: account.date})
	})
	
})

router.post('/payment', function (req, res, next){
	stripe.charges.create({
		amount: 400,
		currency: "usd",
		source: req.body.stripeToken,
		description: "Charge for " + req.body.stripeEmail
	}, function (err, charge){
		if(err){
			res.send("You got an error: "+ err)
		}else{
			res.redirect('/thankyou')
		}
	})
})

router.get('/email', function (req, res, next){
	var transporter = nodeMailer.createTransport({
		service: 'Gmail',
		auth: {
			user: vars.email,
			pass: vars.pass
		}
	})
	var text = "This is a test email sent from my node server";
	var mailOptions = {
		from: 'Freddy Calk <freddycalk@gmail.com>',
		to: 'Freddy Calk <freddycalk@gmail.com>',
		subject: 'This is a test email',
		text: text 
	}
	transporter.sendMail(mailOptions, function (err, info){
		if(err){
			console.log(err);
			res.json({response : err});
		}else{
			console.log("Message was successfully send. Response was "+ info.response);
			res.json({response: "success"});
		}
	})
})

router.get('/contact', function (req, res, next){
	res.render('contact',{grind: account.grind, frequency: account.frequency, quantity: account.unitQuantity, username: req.session.username, address1: address1, address2: address2, fullName: fullName, city: city, state: state, zip: zip, date: date})
})

module.exports = router;
