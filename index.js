const debug = require('debug')('trpg:component:player');
const uuid = require('uuid/v1');
const md5 = require('./md5');
const event = require('./lib/event');
const PlayerList = require('./lib/list');

module.exports = function PlayerComponent(app) {
  initStorage.call(app);
  initFunction.call(app);
  initSocket.call(app);
  initTimer.call(app);
  initReset.call(app);
}

function initStorage() {
  let app = this;
  let storage = app.storage;
  storage.registerModel(require('./lib/models/user.js'));
  storage.registerModel(require('./lib/models/invite.js'));
  storage.registerModel(require('./lib/models/loginLog.js'));

  app.on('initCompleted', function(app) {
    // 数据信息统计
    debug('storage has been load 2 player db model');
  });
}
function initFunction() {
  let app = this;
  let storage = app.storage;
  app.player = {
    list: new PlayerList(),
    getPlayer: function getPlayer(id, cb) {
      if(typeof id != 'number') {
        throw new Error(`id must be a Number, not a ${typeof id}`);
      }

      storage.connect(function(db) {
        let modelUser = db.models.player_user;
        modelUser.get(id, function(err, user) {
          if(!cb) { return; }

          if(!!err) {
            cb(err, null);
          }else {
            cb(null, user);
          }
          db.close();
        });
      });
    },
    find: function find(uuid, cb) {
      if(typeof uuid !== 'string') {
        throw new Error(`uuid must be a string, not a ${typeof uuid}`);
      }

      storage.connect(function(db) {
        db.models.player_user.find({uuid}, function(err, user) {
          if(!cb) { return; }

          if(!!err) {
            cb(err, null);
          }else {
            cb(null, user[0]);
          }
          db.close();
        });
      });
    },
    getActorList: function getActorList(playerId, cb) {
      if(typeof playerId != 'number') {
        throw new Error(`id must be a Number, not a ${typeof id}`);
      }

      storage.connect(function(db) {
        let modelActor = db.models.player_actor;
        modelActor.find({user_id: playerId}, function(err, actor) {
          if(!cb) { return; }

          if(!!err) {
            cb(err, null);
          }else {
            cb(null, actor);
          }
          db.close();
        });
      });
    },
    getActor: function getActor(id, cb) {
      if(typeof id != 'number') {
        debug(`id must be a Number, not a ${typeof id}`);
        return;
      }

      storage.connect(function(db) {
        let modelActor = db.models.player_actor;
        modelActor.get(id, function(err, actor) {
          if(!cb) { return; }

          if(!!err) {
            cb(err, null);
          }else {
            cb(null, actor);
          }
          db.close();
        });
      });
    },
    makeFriend: function makeFriend(uuid1, uuid2, cb) {
      if(!uuid1 || !uuid2) {
        debug('make friend need 2 uuid: receive %o', {uuid1, uuid2});
        return;
      }

      storage.connect(function(db) {
        let modelUser = db.models.player_user;

        modelUser.one({uuid: uuid1}, function(err, user1) {
          modelUser.one({uuid: uuid2}, function(err, user2) {
            let isErrorSend = false;
            let flag = false;
            let handleError = function(err) {
              if(!!err && !isErrorSend) {
                isErrorSend = true;
                cb(err);
              }else {
                if(flag === true) {
                  cb(null);
                }
                flag = true;
              }
            }
            user1.addFriends([user2], handleError);
            user2.addFriends([user1], handleError);
            db.close();
          })
        })
      });
    },
    makeFriendAsync: async function(uuid1, uuid2) {
      if(!uuid1 || !uuid2) {
        debug('make friend need 2 uuid: receive %o', {uuid1, uuid2});
        return;
      }

      const db = await storage.connectAsync();
      try {
        let user1 = await db.models.player_user.oneAsync({uuid: uuid1});
        let user2 = await db.models.player_user.oneAsync({uuid: uuid2});
        await user1.addFriendsAsync([user2]);
        await user2.addFriendsAsync([user1]);
      } catch(err) {
        throw err;
      } finally {
        db.close();
      }
    },
    getFriends: function(uuid, cb) {
      storage.connect(function(db) {
        let modelUser = db.models.player_user;

        modelUser.one({uuid}, function(err, user) {
          if(!!err) {
            cb(err)
          }else {
            user.getFriends(cb)
          }
          db.close();
        });
      });
    }
  }
}
function initSocket() {
  let app = this;
  app.registerEvent('player::login', event.login);
  app.registerEvent('player::loginWithToken', event.loginWithToken);
  app.registerEvent('player::register', event.register);
  app.registerEvent('player::getInfo', event.getInfo);
  app.registerEvent('player::updateInfo', event.updateInfo);
  app.registerEvent('player::changePassword', event.changePassword);
  app.registerEvent('player::logout', event.logout);
  app.registerEvent('player::findUser', event.findUser);
  app.registerEvent('player::addFriend', event.addFriend);
  app.registerEvent('player::getFriends', event.getFriends);
  app.registerEvent('player::sendFriendInvite', event.sendFriendInvite);
  app.registerEvent('player::refuseFriendInvite', event.refuseFriendInvite);
  app.registerEvent('player::agreeFriendInvite', event.agreeFriendInvite);
  app.registerEvent('player::getFriendsInvite', event.getFriendsInvite);

  // TODO:需要考虑到断线重连的问题
  app.on('disconnect', function(socket) {
    let player = app.player.list.find(socket);
    if(player) {
      debug('user[%s] disconnect, remove it from list', player.uuid);
      app.player.list.remove(player.uuid);
    }
  })
}

function initTimer() {
  let app = this;

  app.registerStatJob('playerCount', async () => {
    let db = await app.storage.connectAsync();
    let res = await db.models.player_user.countAsync();
    db.close();
    return res;
  })

  app.registerStatJob('playerLoginIPParse', async () => {
    let db;
    try {
      db = await app.storage.connectAsync();
      let logs = await db.models.player_login_log.findAsync({ip_address: null});
      for (let log of logs) {
        let ip = log.ip;
        if (ip.indexOf(':') >= 0) {
          let tmp = ip.split(':');
          ip = tmp[tmp.length - 1];
        }
        debug('请求ip信息地址:', ip);
        let info = await app.request.post('http://ip.taobao.com/service/getIpInfo2.php', 'ip='+ip, {
          headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        });
        if(info.code === 0) {
          let data = info.data;
          log.ip_address = `[${data.isp}]${data.country} ${data.region} ${data.city} ${data.county}`;
          debug('请求ip信息结果:', log.ip_address);
          await log.saveAsync();
        }
      }
      return new Date().valueOf();
    }catch (error) {
      debug('parse player login log ip error:', error);
    } finally {
      db && db.close();
    }
  })
}

function initReset() {
  let app = this;

  app.register('resetStorage', async function(storage, db) {
    debug('start reset player storage');
    try {
      let players = [];
      for (let i = 1; i <= 10; i++) {
        players.push({
          username: 'admin' + i,
          password: md5(md5('admin')),
        })
      }
      let res = await db.models.player_user.createAsync([{
        username: 'admin',
        password: md5(md5('admin')),
        avatar: 'http://www.qqzhi.com/uploadpic/2015-01-22/022222987.jpg',
        nickname: '管理员',
        sign: '伟大的管理员大大',
      }, ...players]);

      // 测试：相互添加好友
      await res[0].addFriendsAsync([res[1]]);
      await res[1].addFriendsAsync([res[0]]);
      debug('player storage reset completed!');
    }catch(err) {
      console.error(err);
      throw err;
    }
  });
}
