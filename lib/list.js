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

// 其中DB是user相关联的数据实例。添加是为了移除时能关闭。这是一个长连接。平时不关只有在删除才会关闭
// TODO: 之后可以考虑进行二次优化
PlayerList.prototype.add = function add(user, socket, db) {
  let uuid = user.uuid;
  for (player of this.list) {
    if(player.uuid === uuid) {
      if(player.socket !== socket) {
        this.remove(uuid, true);
        break;
      }else {
        debug('player %s login', uuid);
        return;
      }
    }
  }

  this.list.push({uuid, user, socket, db});
  debug('add success, current list have %d player', this.list.length);
}

PlayerList.prototype.remove = function remove(uuid, slient = false) {
  let list = this.list;
  for (var i = 0; i < list.length; i++) {
    let p = list[i];
    if(p.uuid === uuid) {
      if(slient === true) {
        p.socket.emit('player::tick', {msg: '你已在其他地方登陆'});
        p.socket.disconnect();
      }
      list.splice(i, 1);
      try {
        p.db.close();
      }catch(e) {
        console.error('close user db connection error:', e);
      }
      debug('remove user(%s) success! current list have %d player', uuid, this.list.length);
      return true;
    }
  }

  return false;
}
