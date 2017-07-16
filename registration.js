var express = require('express');
var router = express();
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var validator = require('express-validator');
var db = require('./db');

router.use(validator());
router.use(bodyParser.urlencoded({extended: false}));
router.use(bodyParser.json({extended: false}));
router.use(expressSession({secret: 'top secret', resave: false, saveUninitialized: true}));

router.get('/', function(req, res){
	if (req.session.login) {
		if (req.session.usertype == 'admin') {
			res.redirect('/adminhome');
		} else {
			res.redirect('/userhome');
		}
	} else {
		res.render('view_registration',{message: [{msg:""}]});
	}
});

router.post('/', function(req, res) {
	req.check('username', 'Username cannot be empty').notEmpty();
	req.check('password', 'Password cannot be empty').notEmpty();
	req.check('repassword', 'Passwords do not match').equals(req.body.password);
	req.check('fullname', 'Full name cannot be empty').notEmpty();
	req.check('email', 'Must be a valid email').isEmail();
	req.check('mobile', 'Must be a valid mobile no').matches(/01\d\d\d\d\d\d\d\d\d$/);
	var problems = req.validationErrors();

	if(problems) {
		res.render('view_registration', {message: problems});
	} else {
		var username = req.body.username;
		var password = req.body.password;
		var fullname = req.body.fullname;
		var email = req.body.email;
		var mobile = req.body.mobile;
		var type = 'user';

		var sql = "INSERT INTO `user` (`id`, `username`, `password`, `type`, `name`, `email`, `mobile`) VALUES (NULL, '"+username+"', '"+password+"', '"+type+"', '"+fullname+"', '"+email+"', '"+mobile+"')";
		db.getData(sql, null, function(result) {
			res.redirect('/login');
		});
	}
});

module.exports = router;