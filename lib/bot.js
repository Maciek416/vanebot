'use-strict';

var addressGPS = require('address-gps');
var forecast = require('weather-forecast');
var Domo = require('domo-kun');
var distance = require('gps-distance');
var upsidedown = require('upsidedown');

var coolFace = require('cool-ascii-faces');
var MAX_FACE_LENGTH = coolFace.faces.reduce(function(max, f){ return Math.max(max, f.length); }, -Infinity);
var MAX_FACE_COUNT = Math.round(420 / 7);

// Create and return a started bot initialized with config
module.exports = function(config) {

  var bot = new Domo(config);

  // Note: Domo itself responds to CTCP ping - this is a courtesy diagnostic in-channel ping.
  bot.route('!ping', function(res) {
    this.say(res.channel, res.nick + ': pong');
  });

  bot.route('!u :anything', function(res) {
    this.say(res.channel, upsidedown(res.params.anything));
  });

  var faceHandler = function(res) {
    var numFaces = Math.min(MAX_FACE_COUNT, parseInt(res.params.numfaces) || 1);
    var count = 0;
    var msg = res.nick + ': ';
    while(count < numFaces && msg.length < (420 - MAX_FACE_LENGTH)){
      msg += ' ' + coolFace();
      count++;
    }
    this.say(res.channel, msg);
  };
  bot.route('!face', faceHandler);
  bot.route('!face :numfaces', faceHandler);

  bot.route('!distance :source to :dest', function(res) {
    if(res.params.source && res.params.dest){
      var sourceCoords = res.params.source.split(',');
      var destCoords = res.params.dest.split(',');
      if(sourceCoords.length === 2 && destCoords.length === 2) {
        var sX = parseFloat(sourceCoords[0]);
        var sY = parseFloat(sourceCoords[1]);
        var dX = parseFloat(destCoords[0]);
        var dY = parseFloat(destCoords[1]);
        if(!isNaN(sX) && !isNaN(sY) && !isNaN(dX) && !isNaN(dY)) {
          try {
            var dist = distance(sX,sY,dX,dY);
            if(!isNaN(dist)) {
              this.say(res.channel, res.params.source.trim() + ' -> ' + res.params.dest.trim() + ' = ' + Math.round(dist) + 'km (~' + Math.round(dist * 0.621371) + 'mi)');
            }
          } catch(e){
            // Keep the bot quiet if this fails
          }
        }
      }
    }
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