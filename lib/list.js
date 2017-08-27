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

PlayerList.prototype.get = function get(uuid) {
  let result = null;
  for (player of this.list) {
    if(player.uuid === uuid) {
      result = player;
      break;
    }
  }

  return result;
}

PlayerList.prototype.add = function add(user, socket) {
  let uuid = user.uuid;
  for (player of this.list) {
    if(player.uuid === uuid) {
      if(player.socket !== socket) {
        this.remove(uuid);
        break;
      }else {
        debug('player %s has been login', uuid);
        return;
      }
    }
  }

  this.list.push({uuid, user, socket});
  debug('add success, current list have %d player', this.list.length);
}

PlayerList.prototype.remove = function remove(uuid) {
  let list = this.list;
  for (var i = 0; i < list.length; i++) {
    let p = list[i];
    if(p.uuid === uuid) {
      p.socket.emit('player::tick', {msg: '你已在其他地方登陆'});
      p.socket.disconnect();
      list.splice(i, 1);
      debug('remove user(%s) success! current list have %d player', uuid, this.list.length);
      return true;
    }
  }

  return false;
}
