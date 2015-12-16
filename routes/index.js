var express = require('express');
var passport = require('passport');
var Account = require('../models/accounts');
var router = express.Router();
/* GET home page. */
router.get('/', function (req, res, next) {
	console.log(req.user)
	res.render('index', { username: req.session.username});
});

router.get('/logout', function (req, res, next){
	req.session.destroy();
	res.redirect('/')
})

router.get('/register', function (req, res, next){
	res.render('register',{err : false})
})

router.post('/register', function (req, res, next){
	Account.register(new Account(
			{firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			username: req.body.username}),
		req.body.password,
		function (err, account){
			if(err){
				console.log(err)
				return res.render('register', {err: err})
			}
				passport.authenticate('local') (req, res, function (){
					req.session.username = req.body.username;
					res.redirect('/choices')
			})
		}
	)
})

router.get('/login', function (req, res, next){
	if(req.session.username){
		res.redirect('/choices');
	}

	if(req.query.failedLogin){
		res.render('login', {error: true})
	}

	res.render('login', {error:false})
})

router.post('/login', function (req, res, next) {
     passport.authenticate('local', function (err, user, info) {
		console.log(err)
        if (err) {
          return next(err); // will generate a 500 error
        }
        // Generate a JSON response reflecting authentication status
        if (!user) {
          return res.redirect('/login?failedLogin=1');
        }
        if (user){
            // Passport session setup.
            passport.serializeUser(function (user, done) {
              console.log("serializing " + user.username);
              done(null, user);
            });

            passport.deserializeUser(function (obj, done) {
              console.log("deserializing " + obj);
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
			res.render('choices', {username: req.session.username, currGrind: currGrind, currFrequency: currFrequency, unitQuantity: currUnitQuantity});
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
					account.save();
				}
		})
		res.redirect('/delivery')
	}else{
		res.redirect('/')
	}
})

router.get('/delivery', function (req, res, next){
	if(req.session.username){
		res.render('delivery',{username: req.session.username})
	}else{
		res.redirect('/');
	}
})

module.exports = router;
