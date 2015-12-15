var express = require('express');
var passport = require('passport');
var Account = require('../models/accounts');
var router = express.Router();
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express', content: 'Stupid' });
});


router.get('/register', function (req, res, next){
	res.render('register',{ title: 'Express', content: 'Stupid' })
})

router.post('/register', function (req, res, next){
	Account.register(new Account(
		{username: req.body.username}),
		req.body.password,
		function (err, account){
			if(err){
				console.log(err)
				return res.render('index')
			}else{
				passport.authenticate('local') (req, res, function (){
					res.redirect('/');
				})
			}
		}
	)
})

router.get('/login', function (req, res, next){
	res.render('login')
})

router.post('/login', function (req, res, next){
	res.render('login')
})
module.exports = router;
