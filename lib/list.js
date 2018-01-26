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
// TODO: 之后可以考虑进行二次优化，方向: 统一管理事件db的创建与关闭。
PlayerList.prototype.add = function add(user, socket, db) {
  let uuid = user.uuid;
  for (player of this.list) {
    if(player.uuid === uuid) {
      if(player.socket !== socket) {
        this.remove(uuid, true);
        break;
      }else {
        debug('player %s logined', uuid);
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
        try {
          if(p.socket && p.socket.connected) {
            p.socket.emit('player::tick', {msg: '你已在其他地方登陆'});
            p.socket.disconnect();
          }
        }catch(e) {
          console.error('tick player error:', e);
        }
      }

      try {
        // BUG:由于未知原因。使用react native 的devtool reload功能时会无法正常关闭(其他情况下正常).因此在sqlite下不关闭数据库连接
        if(p.db.driver_name !== 'sqlite') {
          console.log('start close user db...');
          p.db.close((err) => {
            console.error('db cb: close user db connection error:', err);
          });
        }
      }catch(e) {
        console.error('close user db connection error:', e);
        return false;
      }

      list.splice(i, 1);

      debug('remove user(%s) success! current list have %d player', uuid, this.list.length);
      return true;
    }
  }

  return false;
}
