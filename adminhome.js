var express = require('express');
var router = express();
var db = require('./db');
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var validator = require('express-validator');

router.use(validator());
router.use(bodyParser.urlencoded({extended: false}));
router.use(bodyParser.json({extended: false}));
router.use(expressSession({secret: 'top secret', resave: false, saveUninitialized: true}));

router.get('/', function(req, res) {
	if(!req.session.login) {
		res.redirect('/login');
		return;
	}
	if(req.session.usertype == 'user') {
		res.redirect('/userhome');
		return;
	}
	var sql = "SELECT * FROM `coachnumber` JOIN route ON coachnumber.routeid=route.routeid";
	db.getData(sql, null, function(result) {
		var data = {'coaches': result };
		res.render('view_adminhome',data);
	});
});

router.get('/coachdetails:id', function(req, res) {
	if(!req.session.login) {
		res.redirect('/login');
		return;
	}
	if(req.session.usertype == 'user') {
		res.redirect('/userhome');
		return;
	}
	console.log("in details");
	if(req.session.login != true) {
		res.redirect('/login');
		return;
	}
	var coachid = req.params.id.replace(':', '');
	var sql = "SELECT * FROM `coachnumber` JOIN route ON coachnumber.routeid=route.routeid where `id`='"+coachid+"'";
	db.getData(sql, null, function(result) {
		var data = {'coaches': result };
		res.render('view_coachdetails',data);
	});
});

router.get('/editcoach:id', function(req, res) {
	if(!req.session.login) {
		res.redirect('/login');
		return;
	}
	if(req.session.usertype == 'user') {
		res.redirect('/userhome');
		return;
	}

	var coachid = req.params.id.replace(':', '');
	var sql = "SELECT * FROM `route`";
	db.getData(sql, null, function(roads) {
		var sql = "SELECT * FROM `coachnumber` JOIN route ON coachnumber.routeid=route.routeid where `id`='"+coachid+"'";
		db.getData(sql, null, function(coach) {
			var data = {'coach': coach, 'roads': roads, 'message': [{msg:""}] };
			res.render('view_editcoach', data);
		});
	});
});

router.post('/editcoach:id', function(req, res) {
	req.check('cid', 'Please insert a valid coach id').matches(/^\w\w\w-\w\w\w-\d\d\d$/);
	req.check('fare', 'Please insert a valid fare').notEmpty().isInt();
	req.check('departuretime', 'Please insert a valid departuretime').matches(/^\d\d:\d\d:\d\d$/);
	req.check('arrivaltime', 'Please insert a valid arrivaltime').matches(/^\d\d:\d\d:\d\d$/);
	var problems = req.validationErrors();

	if(problems) {
		console.log(problems);
		var coachid = req.params.id.replace(':', '');
		var sql = "SELECT * FROM `route`";
		db.getData(sql, null, function(roads) {
			var sql = "SELECT * FROM `coachnumber` JOIN route ON coachnumber.routeid=route.routeid where `id`='"+coachid+"'";
			db.getData(sql, null, function(coach) {
				var data = {'coach': coach, 'roads': roads, 'message': problems};
				res.render('view_editcoach', data);
			});
		});
	} else {
		console.log("in else");
		var pcoachid = req.params.id.replace(':', '');
		var id = req.body.cid;
		var type = req.body.type;
		var fare = req.body.fare;
		var totalseat = req.body.totalseat;
		var departuretime = req.body.departuretime;
		var arrivaltime = req.body.arrivaltime;
		var routeid = req.body.route;

		var sql = "UPDATE `coachnumber` SET `id` = '"+id+"', `type` = '"+type+"' , `fare` = '"+fare+"' , `totalseat` = '"+totalseat+"' , `departuretime` = '"+departuretime+"' , `arrivaltime` = '"+arrivaltime+"' , `routeid` = '"+routeid+"' WHERE `coachnumber`.`id` = '"+pcoachid+"'";
		db.getData(sql, null, function(result) {
			console.log("edit done");
			res.redirect("/adminhome/coachdetails:"+id+"");
			return;
		});
	}

});	

router.get('/deletecoach:id', function(req, res) {
	if(!req.session.login) {
		res.redirect('/login');
		return;
	}
	if(req.session.usertype == 'user') {
		res.redirect('/userhome');
		return;
	}

	var coachid = req.params.id.replace(':', '');
	var sql = "SELECT * FROM `coachnumber` JOIN route ON coachnumber.routeid=route.routeid where `id`='"+coachid+"'";
	db.getData(sql, null, function(result) {
		var data = {'coaches': result };
		res.render('view_deletecoach',data);
	});
});

router.post('/deletecoach:id', function(req, res) {
	if(req.session.login != true) {
		res.redirect('/login');
		return;
	}
	var coachid = req.params.id.replace(':', '');
	var sql = "DELETE FROM `coachnumber` WHERE `coachnumber`.`id` = '"+coachid+"'";
	db.getData(sql, null, function(result) {
		res.redirect('/');
	});
});

router.get('/coaches', function(req, res) {
	if(!req.session.login) {
		res.redirect('/login');
		return;
	}
	if(req.session.usertype == 'user') {
		res.redirect('/userhome');
		return;
	}

	var sql = "SELECT * FROM `route`";
	db.getData(sql, null, function(roads) {
		var sql = "SELECT * FROM `coachnumber` JOIN route ON coachnumber.routeid=route.routeid";
		db.getData(sql, null, function(coachNumber) {
			var data = {'coaches': coachNumber, 'roads': roads, 'message': [{msg:""}]};
			res.render('view_coaches', data);
		});
	});
});

router.post('/coaches', function(req, res) {
	if(req.session.login != true) {
		res.redirect('/login');
		return;
	}

	req.check('cid', 'Please insert a valid coach id').matches(/^\w\w\w-\w\w\w-\d\d\d$/);
	req.check('fare', 'Please insert a valid fare').notEmpty().isInt();
	req.check('departuretime', 'Please insert a valid departuretime').matches(/^\d\d:\d\d:\d\d$/);
	req.check('arrivaltime', 'Please insert a valid arrivaltime').matches(/^\d\d:\d\d:\d\d$/);
	var problems = req.validationErrors();

	if(problems) {
		var sql = "SELECT * FROM `route`";
		db.getData(sql, null, function(roads) {
			var sql = "SELECT * FROM `coachnumber` JOIN route ON coachnumber.routeid=route.routeid";
			db.getData(sql, null, function(coach) {
				var data = {'coaches': coach, 'roads': roads, 'message': problems};
				res.render('view_coaches', data);
			});
		});
	} else {
		console.log("in else");
		var id = req.body.cid;
		var type = req.body.type;
		var fare = req.body.fare;
		var totalseat = req.body.totalseat;
		var departuretime = req.body.departuretime;
		var arrivaltime = req.body.arrivaltime;
		var routeid = req.body.route;

		var sql = "INSERT INTO `coachnumber` (`id`, `type`, `fare`, `totalseat`, `departuretime`, `arrivaltime`, `routeid`) VALUES ('"+id+"', '"+type+"', '"+fare+"', '"+totalseat+"', '"+departuretime+"', '"+arrivaltime+"', '"+routeid+"');";
		db.getData(sql, null, function(result) {
			console.log("Adding done");
			res.redirect("/adminhome/coachdetails:"+id+"");
			return;
		});
	}
});

router.get('/routes', function(req, res) {
	if(!req.session.login) {
		res.redirect('/login');
		return;
	}
	if(req.session.usertype == 'user') {
		res.redirect('/userhome');
		return;
	}

	var sql = "SELECT * FROM `route` ORDER BY routeid";
	db.getData(sql, null, function(roads) {
		var data = {'roads': roads, 'message': [{msg:""}]};
			res.render('view_routes', data);
	});
});

router.post('/routes', function(req, res) {
	if(req.session.login != true) {
		res.redirect('/login');
		return;
	}

	req.check('origin', 'Please insert a valid origin').notEmpty();
	req.check('destination', 'Please insert a valid destination').notEmpty();

	var problems = req.validationErrors();

	if(problems) {
		var sql = "SELECT * FROM `route`";
		db.getData(sql, null, function(roads) {
			var data = {'roads': roads, 'message': [{msg:""}]};
			res.render('view_routes', data);
		});
	} else {
		var origin = req.body.origin;
		var destination = req.body.destination;

		var sql = "INSERT into route (origin,destination) VALUES ('"+origin+"', '"+destination+"')";
		db.getData(sql, null, function(result) {
			res.redirect('/adminhome/routes');
			return;
		});
	}
});

router.get('/reservations', function(req, res) {
	if(!req.session.login) {
		res.redirect('/login');
		return;
	}
	if(req.session.usertype == 'user') {
		res.redirect('/userhome');
		return;
	}

	var sql = "SELECT reserve.coachid, reserve.date, reserve.seat,coachnumber.type,coachnumber.fare, coachnumber.departuretime,coachnumber.arrivaltime,route.origin,route.destination, user.name FROM reserve JOIN coachnumber ON reserve.coachid=coachnumber.id JOIN route ON coachnumber.routeid=route.routeid JOIN user on reserve.userid=user.id ORDER BY reserve.id";
	db.getData(sql, null, function(result) {
		var data = {'reservations': result};
		res.render("view_reservetions", data);
	});
});

router.get('/coachreports', function(req, res) {
	if(!req.session.login) {
		res.redirect('/login');
		return;
	}
	if(req.session.usertype == 'user') {
		res.redirect('/userhome');
		return;
	}

	var sql = "SELECT coachid,COUNT(*) as count FROM reserve GROUP BY coachid ORDER BY count DESC";
	db.getData(sql, null, function(result) {
		var data = {'report': result};
		res.render("view_coachreport", data);
	});
});

router.get('/reservetypereports', function(req, res) {
	if(!req.session.login) {
		res.redirect('/login');
		return;
	}
	if(req.session.usertype == 'user') {
		res.redirect('/userhome');
		return;
	}
	
	var sql = "SELECT coachnumber.type,COUNT(*) as counts FROM reserve JOIN coachnumber ON reserve.coachid=coachnumber.id GROUP BY coachnumber.type ORDER BY counts DESC";
	db.getData(sql, null, function(result) {
		var data = {'report': result};
		res.render("view_reservetypereport", data);
	});
});

router.get('/logout', function(req, res) {
	req.session.destroy();
	res.redirect('/');
	return;
});

module.exports = router;