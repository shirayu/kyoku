var exec = require('child_process').exec;
var events = require('events');
var util = require('util');

var Player = function(targetApplication){
  var self = this;
  self.targetApplication = 'iTunes';
  events.EventEmitter.call(this);

  self.track = {};

  var cmds = {}
  cmds['iTunes'] = 'osascript -l JavaScript -e \''
    + 'var itunes = Application("iTunes");'
    + 'var currentTrack = itunes.currentTrack();'
    + 'JSON.stringify({'
      + 'name: itunes.currentStreamTitle() || currentTrack.name(),'
      + 'artist: currentTrack.artist(),'
      + 'album: currentTrack.album(),'
      + 'playing: itunes.playerState() == "playing"'
    + '})\'';

  cmds['VLC'] = 'osascript -l JavaScript -e \''
    + 'var app = Application("VLC");'
    + 'JSON.stringify({'
      + 'name: app.nameOfCurrentItem(),'
      + 'artist: "",'
      + 'album: "",'
      + 'playing: app.playing()'
    + '})\'';

  var fetchData = function(){
    exec(cmds[self.targetApplication], function(e, stdout, stderr){
      var data = {};
      try { data = JSON.parse(stdout); } catch (e) {}
      if (!data.playing){
        if (data.playing != self.track.playing){
          self.track = {playing: false};
          self.emit('paused');
        }
        return;
      }
      if (data.playing != self.track.playing){
        self.track = data;
        self.emit('playing', data);
        return;
      }
      if (data.name != self.track.name || data.album != self.track.album || data.artist != self.track.artist){
        self.track = data;
        self.emit('playing', data);
      }
    });
  };

  fetchData();
  setInterval(fetchData, 1000);
}

util.inherits(Player, events.EventEmitter);

module.exports = new Player();
