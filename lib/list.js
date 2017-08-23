const debug = require('debug')('trpg:component:player:list');

module.exports = PlayerList;

function PlayerList() {
  if (!(this instanceof PlayerList)) return new PlayerList();

  this.list = [];
  return this;
}

PlayerList.prototype.find = function find(socket) {
  let result = null;
  for (player of this.list) {
    if(player.socket === socket) {
      result = player;
      break;
    }
  }

  return result;
}

PlayerList.prototype.get = function get(userId) {
  let result = null;
  for (player of this.list) {
    if(player.id === userId) {
      result = player;
      break;
    }
  }

  return result;
}

PlayerList.prototype.add = function add(user, socket) {
  let id = user.id;
  for (player of this.list) {
    if(player.id === id) {
      if(player.socket !== socket) {
        this.remove(id);
      }
      break;
    }
  }

  this.list.push({id, user, socket});
  debug('add success, current list have %d player', this.list.length);
}

PlayerList.prototype.remove = function remove(id) {
  let list = this.list;
  for (var i = 0; i < list.length; i++) {
    let p = list[i];
    if(p.id === id) {
      p.socket.emit('player::tick', {msg: '你已在其他地方登陆'});
      p.socket.disconnect();
      list.splice(i, 1);
      debug('remove user(%d) success! current list have %d player', id, this.list.length);
      return true;
    }
  }

  return false;
}
