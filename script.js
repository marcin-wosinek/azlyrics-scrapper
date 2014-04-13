var casper = require('casper').create(),
  utils = require('utils'),
  fs = require('fs');

var band = casper.cli.get(0);

var isTest = false;

if (casper.cli.get(1) == 'test') {
  isTest = true;
}

if (!band) {
  casper.echo('Please add band name as first argument');
  casper.exit(1);
}

var bandUrl = 'http://www.azlyrics.com/' + band.charAt(0) + '/' + band + '.html';

casper.echo('Getting '+ band + ' main page from ' + bandUrl);

var tracs = [];

casper.start(bandUrl, function() {
  var title = this.getTitle();

  if (title == 'A-Z Lyrics Universe') {
    this.echo('The band wasn\'t found');
    this.exit(2);
  }

  tracs = this.getElementsAttribute('#listAlbum a:not([rel="external"])', 'href');
});

var content = '<html>';
content += '<head>';
content += '<title>' + band + ' lyrics</title>';
content += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
content += '<body>';

casper.then(function() {

  if (isTest) {
    tracs.length = 1;
  }

  this.eachThen(tracs, function (trac) {

    var lyricsUrl = 'http://www.azlyrics.com/lirics/' + trac.data;

    this.echo('Fetching lyrics from: ' + lyricsUrl);

    this.thenOpen(lyricsUrl, function() {
      var pageTitle = this.getTitle(),
        needle = 'LYRICS - ',
        needleIndex = pageTitle.indexOf(needle);

      if (needleIndex < 0) {
        this.echo('The lirics wasn\'t found on ' + lyricsUrl);
      }

      var index = needleIndex + needle.length,
        lyricsTitle = pageTitle.substring(index),
        lyricsContent = this.getHTML('#main > div:not([class])');

      content += '<h2>' + lyricsTitle + '</h2>';
      content += '<p>' + lyricsContent + '</p>';
    });
  });

});

casper.then(function() {
  content += '</body></html>';

  fs.write(band + '.html', content);
});

casper.run();
