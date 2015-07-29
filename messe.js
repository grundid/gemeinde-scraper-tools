var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');
var baseUrl = 'http://www.ja.de';
var RssCreator = require('./rss.grabber');

function goLive() {
    var listGrabber = new RssCreator(handleList);
    var detailGrabber = new RssCreator(handleDetail);
    var messen = [];

    listGrabber.grab([baseUrl + '/hochzeitsmessen/?objectsPerPage=100'], function(urlMap){
        var urls = [];

        for(var key in urlMap){
            urls = urls.concat(urlMap[key]);
        }

        console.log('Grabbing Details');

        detailGrabber.grab(urls, function (singerMap){
            fs.writeFile('messen.json', JSON.stringify(singerMap, null, 4), function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("JSON saved to " + 'messen.json');
                }
            });
        })
    })
}