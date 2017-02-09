var express = require('express');
var router = express.Router();
var config = require('../config/config.js')
var mysql  = require('mysql');
var connection = mysql.createConnection({
    host     : config.host,
    user     : config.username,
    password : config.password,
    database : config.database
});

connection.connect();


// GET index
router.get('/', function(req, res, next) {
    var getImagesQuery = `select * from images where id NOT IN (select image_id from votes where ip = "::1")`;
    connection.query(getImagesQuery, (error, results, fields) => {
        var randomIndex = Math.floor(Math.random() * results.length);
        if (results.length === 0) {
            res.render('game_over', { msg: "Game over" });
        } else {
            res.render('index', {
                title: 'Evil or Not',
                imageToRender: `/images/${results[randomIndex].img_url}`,
                imageTitle: results[randomIndex].img_name,
                imageId: results[randomIndex].id
            });
        }
    })
});


router.get('/vote/:vote_direction/:image_id', (req, res, next) => {
    var imageId = req.params.image_id;
    var vote = req.params.vote_direction;
    if (vote === 'evil') {
        vote = 1;
    } else {
        vote = -1;
    }
    var insertVoteQuery = `INSERT INTO votes (ip, image_id, vote_direction) values ("${req.ip}", "${imageId}", "${vote}")`;
    connection.query(insertVoteQuery, (error, results, fields) => {
        if (error) throw error;
        res.redirect('/?vote=success');
    });
});


// GET Standings
router.get('/standings', (req, res, next) => {
    var standingsQuery = `SELECT
                            images.id,
                            images.img_url,
                            images.img_name,
                            SUM(votes.vote_direction) as total_votes from votes
	                        inner join images on images.id = votes.image_id
                            group by votes.image_id`;
    connection.query(standingsQuery, (error, results, fields) => {
        if (error) throw error;
        // res.json(results);
        res.render('standings', { totals: results });
    })
})


module.exports = router;
