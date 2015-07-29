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
            messe['Location'] = $(this).find('b[itemprop=name]').text();

            $(this).find('span[itemprop=address]').each(function () {
                messe['Strasse'] = $(this).find('span[itemprop=streetAddress]').text();
                messe['PLZ'] = $(this).find('span[itemprop=postalCode]').text();
                messe['Veranstaltungsort'] = $(this).find('span[itemprop=addressLocality]').text();
                messe['Land'] = $(this).find('span[itemprop=addressCountry]').text();

            });
        }
        else if (label == 'Messe-Veranstalter') {

            var count = 0;
            $(this).find('p').each(function () {
                var addr = removetabs($(this).text().trim()).split(/\t/);

                if (count == 0) {
                    messe['VeranstalterName'] = addr[0].trim();
                    messe['VeranstalterStrasse'] = addr[1].trim();
                    messe['VeranstalterPLZ'] = addr[2].split(' ')[0].trim();
                    messe['VeranstalterOrt'] = addr[2].split(' ')[1].trim();
                }
                else if (count == 1) {
                    messe['VeranstalterTel'] = addr[0].trim();
                    messe['VeranstalterMail'] = addr[1].trim();

                    $(this).find('a').each(function () {
                        if ($(this).text() == 'Homepage des Veranstalters ...') {
                            messe['VeranstalterUrl'] = $(this).attr('href');
                        }
                    });
                }
                console.log('[' + addr + ']');
                count++;
            });
        }
        else if (label == 'Messe-Preise') {

            var price = '';
            $(this).find('tr').each(function () {
                price += removetabs($(this).find('td.listTableHeaderLeft').text()) + '\n';
                price += removetabs($(this).find('td[style]').text());
            })
            messe['Preise'] = price;
        }

    });
    console.log(messe);

    return messe;
}


function readFromFile() {
    fs.readFile('einemesse.html', function (err, data) {
        if (err)
            throw err;
        var messen = handleDetail(data);

        var outputFilename = 'messen.json';

        /*fs.writeFile(outputFilename, JSON.stringify(messen, null, 4), function (err) {
         if (err) {
         console.log(err);
         } else {
         console.log("JSON saved to " + outputFilename);
         }
         });*/
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

//module.exports = readFromFile;