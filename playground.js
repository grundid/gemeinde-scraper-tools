var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');
var baseUrl = 'http://www.hochzeitssaengerinnen-und-hochzeitssaenger.de';

function handleList(data) {
    var $ = cheerio.load(data);

    var count = 0;
    $('a[itemprop=url]').each(function () {
        var link = $(this);
        var title = link.text();
        var href = link.attr('href');

        if (href) {
            count++;
            console.log(title + ", " + href);
        }
    });

    console.log('Total count:' + count);

}

function handleDetail(data) {
    var $ = cheerio.load(data);

    var messe = {};
    var content = $('#content');
    messe['title'] = content.find('h1[itemprop=name]').text();

    content.find('a').each(function () {
        if ($(this).text() == "Link zur Homepage der Hochzeitsmesse ...") {
            messe['url'] = $(this).attr('href');
        }
    });

    content.find('fieldset').each(function () {
        var label = $(this).find('legend').text();

        if (label == 'Messe-Termin(e)') {
            var day = 0;

            $(this).find('p').each(function () {
                day++;
                var dateLabel = '';

                $(this).contents().each(function () {
                    var text = $(this).text().trim();

                    if (text.indexOf(',') != -1) {
                        dateLabel = text.substring(text.indexOf(',') + 1, text.length).trim();
                    }
                    else if (text.length > 0) {
                        dateLabel += ', ' + text;
                    }

                });

                console.log('[' + dateLabel + ']');
                console.log('- -');

                messe['Tag' + day] = dateLabel;
            });
        }
        else if (label == 'Messe-Ort') {
            messe['Location']=$(this).find('b[itemprop=name]').text();

            $(this).find('span[itemprop=address]').each(function(){
                messe['Straße']=$(this).find('span[itemprop=streetAddress]');
                messe['PLZ']=$(this).find('span[itemprop=postalCode]');
                messe['Veranstaltungsort']=$(this).find('span[itemprop=addressLocality]');
                messe['Veranstaltungsort']=$(this).find('span[itemprop=addressLocality]');
            });
        }

        console.log(label);
    });

    return messe;
}


function readFromFile() {
    fs.readFile('einemesse.html', function (err, data) {
        if (err)
            throw err;
        var messen = handleDetail(data);

        var outputFilename = 'messen.json';

        fs.writeFile(outputFilename, JSON.stringify(messen, null, 4), function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("JSON saved to " + outputFilename);
            }
        });
    });
}

function removetabs(value) {
    var pattern = /\t\t/;

    var beforeLength;
    var newLength;

    do {
        beforeLength = value.length;
        value = value.replace(pattern, '\t');
        newLength = value.length;
    }
    while (beforeLength > newLength);

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

readFromFile();
//getLive();

module.exports = readFromFile;