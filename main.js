'use-strict';

var _ = require('underscore');
var createBot = require('./lib/bot');

var nconf = require('nconf');
nconf.file('./bot.conf');
var config = nconf.get('bot');
var networks = nconf.get('networks');

// Start an identical but separate bot instance for each network configured in networks
networks.forEach(function(network) {

  var subconfig = _.clone(config);
  subconfig.address = network.address;
  subconfig.channels = network.channels;

  createBot(subconfig);

});
