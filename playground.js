var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');
var baseUrl='http://www.hochzeitssaengerinnen-und-hochzeitssaenger.de';

function handleList(data) {
    var $ = cheerio.load(data);

    var count = 0;
    $('a').each(function () {
        var link = $(this);
        var title = link.text();
        var href = link.attr('href');

        if (href && href.indexOf('hochzeitssaenger') == 0) {
            count++;
            console.log(title + ", " + href);
        }

    });

    console.log('Total count:' + count);

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

function extractPublisher(data) {
    var $ = cheerio.load(data);

    var generator = $('meta[name=generator]').attr('content');
    var publisher = $('meta[name=publisher]').attr('content');
    var author = $('meta[name=author]').attr('content');

    console.log('META: ' + generator + '\t' + publisher + '\t' + author);
    scrapeGemeinde(gemeindeIndex++);
}

function readFromFile() {
    fs.readFile('details.html', function (err, data) {
        if (err)
            throw err;
        var singer = handleDetail(data);

        var outputFilename = 'singer.json';

        fs.writeFile(outputFilename, JSON.stringify(singer, null, 4), function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("JSON saved to " + outputFilename);
            }
        });
    });
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

function handleResponse(res) {
    res.on('readable', function () {
        var data = res.read();
        handleList(data);
    });
}
function handleError(e) {
    console.log("Got error: " + e.message);
}

function getLive() {
    console.log("Getting data...");

        var url = baseUrl + '/.nach-bundesland-hochzeitsmusik-hochzeit-music.html';
        console.log("Loading " + url);
        http.get(url, handleResponse).on('error', handleError);
}

function scrapeGemeinde(index) {
    if (index < gemeinden.length) {
        console.log(index + " Getting data for " + gemeinden[index]);
        var url = gemeinden[index];
        http.get(url, function (res) {
            var data = "";
            res.on('readable', function () {
                data += res.read();
            });
            res.on('end', function () {
                var $ = cheerio.load(data);

                var generator = $('meta[name=generator]').attr('content');
                var publisher = $('meta[name=publisher]').attr('content');
                var author = $('meta[name=author]').attr('content');

                console.log('META: ' + generator + '\t' + publisher + '\t' + author);
                scrapeGemeinde(++index);
            });
        }).on('error', function (e) {
            console.log("Got error: " + e.message);
            scrapeGemeinde(++index);
        });
    }
}

//readFromFile();
getLive();