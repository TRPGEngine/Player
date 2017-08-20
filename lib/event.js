const debug = require('debug')('trpg:component:player:event');
const md5 = require('../md5');
const uuid = require('uuid/v1');

exports.login = function login(data, cb) {
  let app = this.app;
  let socket = this.socket;

  try {
    if(typeof data === 'string') {
      data = JSON.parse(data);
    }

    let username = data.username;
    let password = data.password;

    if(!!username && !!password) {
      app.storage.connect(function(db) {
        let modelUser = db.models.player_user;
        modelUser.one({username, password: md5(password)}, function(err, user) {
          if(!!err) {
            throw new Error(err);
          }

          if(!user) {
            debug('login fail, try to login %s and password error', username);
            if(!!cb) {
              cb({result: false, msg: "账户或密码错误"});
            }
          } else {
            debug('login success!user %s has been login', user.username);
            // console.log(user.getInfo());
            user.last_login = new Date();
            user.token = uuid();
            user.save();

            // 加入到列表中
            if(!!app.player) {
              app.player.list.add(user, socket);
            }

            if(!!cb) {
              cb({result: true, info: user.getInfo()});
            }
          }
        })
      });
    } else {
      debug('login fail, miss necessary parameter: %o', data);
      if(!!cb) {
        cb({result: false, msg: "缺少必要参数"});
      }
    }
  } catch (e) {
    debug('login fail. received data %o \n%O', data, e);
  }
}

exports.loginWithToken = function loginWithToken(data, cb) {
  let app = this.app;
  let socket = this.socket;
  // TODO

  try {
    if(typeof data === 'string') {
      data = JSON.parse(data);
    }

    let uuid = data.uuid;
    let token = data.token;

    if(!!uuid && !!token) {
      app.storage.connect(function(db) {
        let modelUser = db.models.player_user;
        modelUser.one({uuid, token}, function(err, user) {
          if(!!err) {
            throw new Error(err);
          }

          if(!user) {
            debug('login with token fail, try to login %s and password error', uuid);
            if(!!cb) {
              cb({result: false, msg: "TOKEN错误或过期"});
            }
          } else {
            debug('login with token success!user %s has been login', user.uuid);
            // console.log(user.getInfo());
            user.last_login = new Date();
            user.token = uuid();
            user.save();

            // 加入到列表中
            if(!!app.player) {
              app.player.list.add(user, socket);
            }

            if(!!cb) {
              cb({result: true, info: user.getInfo()});
            }
          }
        })
      });
    } else {
      debug('login fail, miss necessary parameter: %o', data);
      if(!!cb) {
        cb({result: false, msg: "缺少必要参数"});
      }
    }
  }catch(e) {
    debug('login with token fail. received data %o \n%O', data, e);
  }
}
