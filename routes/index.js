var express = require('express');
var passport = require('passport');
var Account = require('../models/accounts');
var router = express.Router();
/* GET home page. */
router.get('/', function (req, res, next) {
	console.log(req.user)
	res.render('index', { user: req.user});
});


router.get('/register', function (req, res, next){
	res.render('register',{})
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
				return res.render('index')
			}else{
				passport.authenticate('local') (req, res, function (){
					req.session.username = req.body.username;
					res.redirect('/');
				})
			}
		}
	)
})

router.get('/login', function (req, res, next){
	res.render('login')
})

router.post('/login', passport.authenticate('local'), function (req, res){
	req.session.username = req.body.username;
	res.redirect('/')
})
module.exports = router;
