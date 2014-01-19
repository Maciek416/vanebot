'use-strict';

var addressGPS = require('address-gps');
var forecast = require('weather-forecast');
var Domo = require('domo-kun');

// Create and return a started bot initialized with config
module.exports = function(config) {

  var bot = new Domo(config);

  // Note: Domo itself responds to CTCP ping - this is a courtesy diagnostic in-channel ping.
  bot.route('!ping', function(res) {
    this.say(res.channel, res.nick + ': pong');
  });


  // Look up a GPS by any address string. Outputs a Google Maps link to resulting found address.
  bot.route('!gps :address', function(res) {
    var self = this;

    var address = (new String(res.params.address)).trim();

    addressGPS.getGPS(address, function(location) {

      var coords = location.latitude + ',' + location.longitude;
      var output = (
          res.nick + 
          ': \u0002Found ' + location.prettyAddress + 
          ' at:\u000F ' + coords + 
          ' http://maps.google.com/maps?q=' + coords
      );

      self.say(res.channel, output);

    }, function() {
      self.say(res.channel, 'couldn\'t resolve GPS coordinates for that location');
    });
  });


  // Look up a forecast by any address string (including GPS)
  bot.route('!f :address', function(res) {
    var self = this;

    var address = (new String(res.params.address)).trim();

    addressGPS.getGPS(address, function(location) {
      
      forecast.getForecast(location.latitude, location.longitude, function(forecast) {

        var forecastStr = forecast.map(function(f) {
          var snowman = f.tempC <= 0 ? ' ☃' : '';
          var output = (
              'in\u00A0' + f.hoursFromNow + 'h:\u00A0' 
              + f.tempC + '˚C\u00A0/\u00A0' 
              + f.tempF + 'F˚'
              + snowman
          );
          return output;
        }).join(' ..... ');

        self.say(res.channel, res.nick + ': \u0002Forecast for ' + location.prettyAddress + ':\u000F ' + forecastStr);

      });

    }, function() {
      self.say(res.channel, 'couldn\'t resolve GPS coordinates for that location');
    });

  });

  bot.connect();

  return bot;
};