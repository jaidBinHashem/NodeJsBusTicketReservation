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
	if(req.session.usertype == 'admin') {
		res.redirect('/adminhome');
		return;
	}
	res.render('view_userhome', {message: [{msg:""}]});
});

router.post('/', function(req, res) {
	if(!req.session.login) {
		res.redirect('/login');
		return;
	}

	req.check('from', 'From field required').notEmpty();
	req.check('to', 'Destinaton field required').notEmpty();
	req.check('date', 'Please insert a valid date').matches(/^\d\d\d\d-\d\d-\d\d$/);
	var problems = req.validationErrors();

	if(problems) {
		res.render('view_userhome', {message: problems});
	}

	var from = req.body.from;
	var to = req.body.to;
	var date = req.body.date;
	req.session.date = date;
	var sql = "SELECT * FROM `coachnumber` JOIN route ON coachnumber.routeid=route.routeid where route.origin='"+from+"' and route.destination='"+to+"'";
	db.getData(sql, null, function(result) {
		if(result.length > 0) {
			var data = {'coaches': result};
			res.render('view_availablecoaches', data);
		}
	});
});

router.get('/reserveseat:id', function(req, res) {
	if(!req.session.login) {
		res.redirect('/login');
		return;
	}
	if(req.session.usertype == 'admin') {
		res.redirect('/adminhome');
		return;
	}

	var date = req.session.date;
	var coachId = req.params.id.replace(':', '');
	var sql = "SELECT seat FROM `reserve` WHERE coachid='"+coachId+"' AND date='"+date+"'";
	db.getData(sql, null, function(result) {
		var reserve = [];
		for (var i = 0; i<result.length; i++) {
			reserve.push(result[i].seat);
		}
		var sql = "SELECT * FROM `coachnumber` JOIN route ON coachnumber.routeid=route.routeid where `id`='"+coachId+"'";
		db.getData(sql, null, function(result) {
			var totalSeat = result[0].totalseat;
			if(totalSeat == 28) {
				var seatsAc = ['A1','A2','A3','B1','B2','B3','C1','C2','C3','D1','D2','D3','E1','E2','E3','F1','F2','F3','G1','G2','G3','H1','H2','H3','I1','I2','I3','I4'];
				if (reserve.length > 0) {
					for (var i = 0; i<reserve.length; i++) {
						var index = seatsAc.indexOf(reserve[i]);						
						seatsAc.splice(index, 1);						
					}
					var data = {'seats': seatsAc, 'coach':result };
					res.render('view_reserveseat', data);
				} else {
					var data = {'seats': seatsAc, 'coach':result };
					res.render('view_reserveseat', data);
				}
			} else if(totalSeat == 36) {
				var seatsNonAc = ['A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4','D1','D2','D3','D4','E1','E2','E3','E4','F1','F2','F3','F4','G1','G2','G3','G4','H1','H2','H3','H4','I1','I2','I3','I4'];
				if (reserve.length > 0) {
					for (var i = 0; i<reserve.length; i++) {
						var index = seatsNonAc.indexOf(reserve[i]);						
						seatsNonAc.splice(index, 1);						
					}
					var data = {'seats': seatsNonAc, 'coach':result };
					res.render('view_reserveseat', data);
				} else {
					var data = {'seats': seatsNonAc, 'coach':result };
					res.render('view_reserveseat', data);
				}
			}
		});
	});
});

router.post('/reserveseat:id', function(req, res) {
	var selectedSeats = req.body.selectedseates;
	var date = req.session.date;
	var coachid = req.params.id.replace(':', '');
	var userid = req.session.userid;

	if (selectedSeats.constructor == Array) {
		for(var i = 0; i < selectedSeats.length; i++) {
		var sql = "INSERT INTO `reserve` (`id`, `userid`, `coachid`, `date`, `seat`) VALUES (NULL, '"+userid+"', '"+coachid+"', '"+date+"', '"+selectedSeats[i]+"')";
		db.getData(sql, null, function(result) {
		});
	}
	} else {
		var sql = "INSERT INTO `reserve` (`id`, `userid`, `coachid`, `date`, `seat`) VALUES (NULL, '"+userid+"', '"+coachid+"', '"+date+"', '"+selectedSeats+"')";
		db.getData(sql, null, function(result) {
		});
	}
	res.redirect('myreserves');
	return;
});

router.get('/myreserves', function(req, res) {
	if(!req.session.login) {
		res.redirect('/login');
		return;
	}
	if(req.session.usertype == 'admin') {
		res.redirect('/adminhome');
		return;
	}

	var userid = req.session.userid;
	var sql = "SELECT reserve.id,user.username,reserve.coachid,reserve.date,reserve.seat,coachnumber.type,coachnumber.fare,coachnumber.departuretime,coachnumber.arrivaltime,route.origin,route.destination FROM reserve JOIN user ON reserve.userid=user.id JOIN coachnumber ON reserve.coachid=coachnumber.id  JOIN route ON coachnumber.routeid=route.routeid WHERE userid='"+userid+"' order by id";

	db.getData(sql, null, function(result) {
		var data = {'reserves': result};
		res.render('view_myreserves', data);
	});
});

router.get('/cancel:id', function(req, res) {
	if(!req.session.login) {
		res.redirect('/login');
		return;
	}
	if(req.session.usertype == 'admin') {
		res.redirect('/adminhome');
		return;
	}
	
	var id = req.params.id.replace(':', '');

	var sql = "SELECT * FROM `reserve` WHERE id='"+id+"'";
	db.getData(sql, null, function(result) {
		if(req.session.userid == result[0].userid) {
			var data = {'reserve': result};
			res.render('view_cancelreserve', data);
		} else {
			res.redirect('/myreserves');
			return;
		}
	});
});

router.post('/cancel:id', function(req, res) {
	var id = req.params.id.replace(':', '');

	var sql = "SELECT * FROM `reserve` WHERE id='"+id+"'";
	db.getData(sql, null, function(result) {
		if(req.session.userid == result[0].userid) {
			var sql = "DELETE FROM `reserve` WHERE `reserve`.`id` = '"+id+"'";
			db.getData(sql, null, function(result) {
				res.redirect('myreserves');
				return;
			})
		} else {
			res.redirect('/myreserves');
			return;
		}
	});
});

router.get('/logout', function(req, res) {
	req.session.destroy();
	res.redirect('/');
	return;
});

module.exports = router;