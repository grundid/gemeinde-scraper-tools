var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');
var baseUrl = 'http://www.hochzeitssaengerinnen-und-hochzeitssaenger.de';
var RssCreator = require('./rss.grabber');

function goLive() {
    var listGrabber = new RssCreator(handleList);
    var detailGrabber = new RssCreator(handleDetail);
    var singers = [];

    listGrabber.grab([baseUrl + '/.nach-bundesland-hochzeitsmusik-hochzeit-music.html'], function(urlMap){
        var urls = [];

        for(var key in urlMap){
            urls = urls.concat(urlMap[key]);
        }

        console.log('Grabbing Details');

        detailGrabber.grab(urls, function (singerMap){
            fs.writeFile('singers.json', JSON.stringify(singerMap, null, 4), function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("JSON saved to " + 'singers.json');
                }
            });
        })
    })
}

function handleList(data) {
    var $ = cheerio.load(data);
    var result=[];

    var count = 0;
    $('a').each(function () {
        var link = $(this);
        var title = link.text();
        var href = link.attr('href');

        if (href && href.indexOf('hochzeitssaenger') == 0) {
            count++;
            console.log(title + ", " + href);
            result.push(baseUrl + '/' + href);
        }

    });

    console.log('Total count:' + count);

    return result;
}

function handleDetail(data) {
    var $ = cheerio.load(data);

    var pattern = /.*line_(.*)\.gif/;
    var singer = {};
    $('table table table table').find('tr').each(function () {
        var tr = $(this);
        var img = tr.find('td:first-child img');

        var imgsrc = img.attr('src');

        if (imgsrc) {
            var matchresult = imgsrc.match(pattern);
            if (matchresult) {
                var data = tr.find('td:nth-child(2)');
                console.log(data.text().trim());

                var key = matchresult[1];
                var value = data.text().trim();

                value = removetabs(value);

                singer[key]=value;

                console.log(matchresult[1]);
                console.log(imgsrc);
            }
        }
    });

    return singer;
}

function removetabs(value){
    var pattern = /\t\t/;

    var beforeLength;
    var newLength;

    do{
        beforeLength = value.length;
        value = value.replace(pattern, '\t');
        newLength=value.length;
    }
    while(beforeLength > newLength);

    return value;
}

goLive();