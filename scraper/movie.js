var request = require('request');
var cheerio = require('cheerio');
var scraperjs = require('scraperjs');
var _ = require('underscore');
var async = require('async');
var Movie = require('../models/movie');

exports.updateMovies = function () {
    async.series([
        function (callback) {
            getMoviesFromTaobao(function (result) {
                async.parallel([
                    function (callback) {
                        var movies = _.union(result.isPlaying, result.willPlay).map(function (movie) {
                            return movie.name;
                        });
                        Movie.find({name: {$not: {$in: movies}}}).exec(function (err, movies) {
                            async.each(movies, function (movie, callback) {
                                movie.status = 0;
                                movie.save(function (err) {
                                    callback(err);
                                });
                            }, function (err) {
                                callback(err);
                            });
                        });
                    },
                    function (callback) {
                        async.each(result.isPlaying, function (movie, callback) {
                            Movie.findOneAndUpdate({
                                name: movie.name
                            }, {
                                $set: {
                                    name: movie.name,
                                    poster: movie.poster,
                                    updateTime: new Date(),
                                    status: 1,
                                    taobaoId: movie.taobaoId
                                }
                            }, {
                                new: true,
                                upsert: true
                            }, function (err) {
                                callback(err);
                            });
                        }, function (err) {
                            callback(err);
                        })
                    },
                    function (callback) {
                        async.each(result.willPlay, function (movie, callback) {
                            Movie.findOneAndUpdate({
                                name: movie.name
                            }, {
                                $set: {
                                    name: movie.name,
                                    poster: movie.poster,
                                    updateTime: new Date(),
                                    status: 2,
                                    taobaoId: movie.taobaoId
                                }
                            }, {
                                new: true,
                                upsert: true
                            }, function (err) {
                                callback(err);
                            });
                        }, function (err) {
                            callback(err);
                        });
                    }
                ], function (err) {
                    callback(err);
                });
            });
        },
        function (callback) {
            getMoviesFromNuomi(function (result) {
                async.parallel([
                    function (callback) {
                        async.each(result.isPlaying, function (movie, callback) {
                            Movie.findOneAndUpdate({
                                name: movie.name
                            }, {
                                $set: {
                                    nuomiId: movie.nuomiId
                                }
                            }, function (err) {
                                callback(err);
                            });
                        }, function (err) {
                            callback(err);
                        })
                    },
                    function (callback) {
                        async.each(result.willPlay, function (movie, callback) {
                            Movie.findOneAndUpdate({
                                name: movie.name
                            }, {
                                $set: {
                                    nuomiId: movie.nuomiId
                                }
                            }, function (err) {
                                callback(err);
                            });
                        }, function (err) {
                            callback(err);
                        });
                    }
                ], function (err) {
                    callback(err);
                });
            });
        },
        function (callback) {
            getMoviesFromMeituan(function (result) {
                async.parallel([
                    function (callback) {
                        async.each(result.isPlaying, function (movie, callback) {
                            Movie.findOneAndUpdate({
                                name: movie.name
                            }, {
                                $set: {
                                    meituanId: movie.meituanId
                                }
                            }, function (err) {
                                callback(err);
                            });
                        }, function (err) {
                            callback(err);
                        })
                    },
                    function (callback) {
                        async.each(result.willPlay, function (movie, callback) {
                            Movie.findOneAndUpdate({
                                name: movie.name
                            }, {
                                $set: {
                                    meituanId: movie.meituanId
                                }
                            }, function (err) {
                                callback(err);
                            });
                        }, function (err) {
                            callback(err);
                        });
                    }
                ], function (err) {
                    callback(err);
                });
            });
        },
        function (callback) {
            getMovieFromDianping(function (result) {
                async.parallel([
                    function (callback) {
                        async.each(result.isPlaying, function (movie, callback) {
                            Movie.findOneAndUpdate({
                                name: movie.name
                            }, {
                                $set: {
                                    dianpingId: movie.dianpingId
                                }
                            }, function (err) {
                                callback(err);
                            });
                        }, function (err) {
                            callback(err);
                        })
                    },
                    function (callback) {
                        async.each(result.willPlay, function (movie, callback) {
                            Movie.findOneAndUpdate({
                                name: movie.name
                            }, {
                                $set: {
                                    dianpingId: movie.dianpingId
                                }
                            }, function (err) {
                                callback(err);
                            });
                        }, function (err) {
                            callback(err);
                        });
                    }
                ], function (err) {
                    callback(err);
                });
            });
        }
    ], function (err) {
        if (err) {
            return console.log(err);
        }
        console.log('Finish update movies');
    });
};

var getMoviesFromTaobao = function (callback) {
    scraperjs.StaticScraper
        .create('https://dianying.taobao.com/showList.htm?n_s=new')
        .scrape(function ($) {
            var $movieList = $(".tab-movie-list");
            var isPlaying = $($movieList[0])
                .find('.movie-card-wrap')
                .map(function () {
                    var href = $(this).find('a.movie-card').attr('href');
                    var taobaoId = href.substring(href.indexOf('showId=') + 7, href.indexOf('&n_s'));
                    var name = $(this).find('.movie-card-name .bt-l').text();
                    return {
                        name: name,
                        poster: $(this).find('.movie-card-poster img').attr('src'),
                        taobaoId: taobaoId
                    };
                }).get();
            var willPlay = $($movieList[1])
                .find('.movie-card-wrap')
                .map(function () {
                    var href = $(this).find('a.movie-card').attr('href');
                    var taobaoId = href.substring(href.indexOf('showId=') + 7, href.indexOf('&n_s'));
                    return {
                        name: $(this).find('.movie-card-name .bt-l').text(),
                        poster: $(this).find('.movie-card-poster img').attr('src'),
                        taobaoId: taobaoId
                    };
                }).get();
            return {
                isPlaying: isPlaying,
                willPlay: willPlay
            }
        })
        .then(function (movies) {
            callback(movies);
        });
};

var getMoviesFromNuomi = function (callback) {
    scraperjs.StaticScraper
        .create('http://nj.nuomi.com/pcindex/main/filmlist?type=1')
        .scrape(function ($) {
            var isPlaying = $("#showing-movies-j")
                .find(".item-box a.item")
                .map(function () {
                    return {
                        name: $(this).attr('title'),
                        poster: $(this).find('img').attr('src'),
                        nuomiId: $(this).attr('href').substring(6)
                    };
                }).get();
            var willPlay = $("#upcoming-movies-j")
                .find(".item-box a.item")
                .map(function () {
                    return {
                        name: $(this).attr('title'),
                        poster: $(this).find('img').attr('src'),
                        nuomiId: $(this).attr('href').substring(6)
                    };
                }).get();
            return {
                isPlaying: isPlaying,
                willPlay: willPlay
            }
        })
        .then(function (movies) {
            callback(movies);
        });
};

var getMoviesFromMeituan = function (callback) {
    async.series([
        function (callback) {
            scraperjs.StaticScraper
                .create('http://www.meituan.com/dianying/zuixindianying')
                .scrape(function ($) {
                    return $("#content")
                        .find(".movie-cell")
                        .map(function () {
                            var $cover = $(this).find('.movie-cell__cover');
                            return {
                                name: $cover.attr("title"),
                                meituanId: /dianying\/(\d+)$/.exec($cover.attr("href"))[1]
                            };
                        }).get();
                })
                .then(function (movies) {
                    callback(null, movies);
                });
        },
        function (callback) {
            scraperjs.StaticScraper
                .create('http://www.meituan.com/dianying/zuixindianying/coming')
                .scrape(function ($) {
                    var movies = [];
                    $("#content").find(".movie-cell")
                        .each(function (i) {
                            // 只要前20个
                            if (i < 20) {
                                var $cover = $(this).find('.movie-cell__cover');
                                movies.push({
                                    name: $cover.attr("title"),
                                    meituanId: /dianying\/(\d+)$/.exec($cover.attr("href"))[1]
                                });
                            }
                        });
                    return movies;
                })
                .then(function (movies) {
                    callback(null, movies);
                });
        }
    ], function (err, results) {
        callback({
            isPlaying: results[0],
            willPlay: results[1]
        });
    });
};

var getMovieFromDianping = function (callback) {
    var isPlaying = [];
    var willPlay = [];
    async.parallel([
        function (callback) {
            request({
                url: 'http://t.dianping.com/movie/nanjing/playing',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.80 Safari/537.36'
                }
            }, function (err, response, body) {
                if (body) {
                    var $ = cheerio.load(body);
                    $('.content .list .list-item').each(function () {
                        var $title = $(this).find('dd.title .text');
                        isPlaying.push({
                            name: $title.text(),
                            dianpingId: $title.attr('href').replace('/movie/', '')
                        })
                    });
                    var pageLinks = $('.page-wrap .Pages').find('a.PageLink').map(function () {
                        return $(this).attr('href');
                    }).get();
                    async.eachSeries(pageLinks, function (link, callback) {
                        request({
                            url: 'http://t.dianping.com/movie/nanjing/playing' + link,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.80 Safari/537.36'
                            }
                        }, function (err, response, body) {
                            if (body) {
                                var $ = cheerio.load(body);
                                $('.content .list .list-item').each(function () {
                                    var $title = $(this).find('dd.title .text');
                                    isPlaying.push({
                                        name: $title.text(),
                                        dianpingId: $title.attr('href').replace('/movie/', '')
                                    });
                                });
                            }
                            callback(err);
                        });
                    }, function (err) {
                        callback(err);
                    });
                }
            });
        },
        function (callback) {
            request({
                url: 'http://t.dianping.com/movie/nanjing/comingsoon',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.80 Safari/537.36'
                }
            }, function (err, response, body) {
                if (body) {
                    var $ = cheerio.load(body);
                    $('.content .list .list-item').each(function () {
                        var $title = $(this).find('dd.title .text');
                        willPlay.push({
                            name: $title.text(),
                            dianpingId: $title.attr('href').replace('/movie/', '')
                        });
                    });
                }
                callback(err);
            });
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        callback({
            isPlaying: isPlaying,
            willPlay: willPlay
        });
    });
};

exports.removeMovies = function (callback) {
    Movie.remove({}, function (err) {
        callback(err);
    })
};