const debug = require('debug')('trpg:component:player:event');
const md5 = require('../md5');
const uuid = require('uuid/v1');

let autoJoinSocketRoom = async function autoJoinSocketRoom(socket) {
  let app = this;
  let player = app.player.list.find(socket);
  if(!player) {
    debug('add room error. not find this socket attach player');
    return;
  }

  if(!app.group) {
    debug('add room error. need group component');
    return;
  }

  let groups = await player.user.getGroupsAsync();
  for(let group of groups) {
    let uuid = group.uuid;
    socket.join(uuid);
  }
}

exports.login = async function login(data, cb, db) {
  let app = this.app;
  let socket = this.socket;

  try {
    if(typeof data === 'string') {
      data = JSON.parse(data);
    }

    // if(app.player.list.find(socket)) {
    //   cb({result: false, msg: '您已经登录，请先登出'})
    // }

    let {username, password, platform, isApp} = data;
    let ip = socket.handshake.headers['x-real-ip'] || socket.handshake.address;

    if(!username || !password) {
      debug('login fail, miss necessary parameter: %o', data);
      cb({result: false, msg: "缺少必要参数"});
      return;
    }

    let user = await db.models.player_user.oneAsync({username, password: md5(password)});
    if(!user) {
      debug('login fail, try to login [%s] and password error', username);
      cb({result: false, msg: "账户或密码错误"});
      await db.models.player_login_log.createAsync({
        user_name: username,
        type: isApp ? 'app_standard' : 'standard',
        ip,
        platform,
        device_info: {
          userAgent: socket.handshake.headers['user-agent'],
          acceptLanguage: socket.handshake.headers['accept-language'],
        },
        is_success: false,
      });
    }else {
      debug('login success!user [%s(%s)] has been login', user.username, user.uuid);
      if(isApp) {
        user.app_token = uuid();
      }else {
        user.token = uuid();
      }

      // 加入到列表中
      if(!!app.player) {
        app.player.list.add(user, socket);
        await autoJoinSocketRoom.call(app, socket);
      }

      cb({result: true, info: user.getInfo(true)});

      // 更新登录信息
      user.last_login = new Date();
      user.last_ip = ip;
      await user.saveAsync();

      // 添加登录记录
      await db.models.player_login_log.createAsync({
        user_uuid: user.uuid,
        user_name: user.username,
        type: isApp ? 'app_standard' : 'standard',
        ip,
        platform,
        device_info: {
          userAgent: socket.handshake.headers['user-agent'],
          acceptLanguage: socket.handshake.headers['accept-language'],
        },
        is_success: true,
        token: isApp ? user.app_token : user.token,
      });
    }
  } catch (e) {
    debug('login fail. received data %o \n%O', data, e);
    cb({result: false, msg: e.toString()});
  }
}

exports.loginWithToken = async function loginWithToken(data, cb, db) {
  let app = this.app;
  let socket = this.socket;
  try {
    if(typeof data === 'string') {
      data = JSON.parse(data);
    }

    // if(app.player.list.find(socket)) {
    //   cb({result: false, msg: '您已经登录，请先登出'})
    // }

    let {uuid, token, platform, isApp, channel} = data;
    let ip = socket.handshake.headers['x-real-ip'] || socket.handshake.address;

    if(!uuid || !token) {
      debug('login with token fail, miss necessary parameter: %o', data);
      cb({result: false, msg: "缺少必要参数"});
      return;
    }

    let cond = {uuid};
    if(isApp) {
      cond.app_token = token;
    }else {
      cond.token = token;
    }
    let user = await db.models.player_user.oneAsync(cond);

    if(!user) {
      debug('login with token fail, try to login %s', uuid);
      cb({result: false, msg: "TOKEN错误或过期"});
      await db.models.player_login_log.createAsync({
        user_uuid: uuid,
        type: isApp ? 'app_token' : 'token',
        ip,
        platform,
        device_info: {
          userAgent: socket.handshake.headers['user-agent'],
          acceptLanguage: socket.handshake.headers['accept-language'],
        },
        is_success: false,
      });
    } else {
      debug('login with token success!user %s has been login', user.uuid);

      // 加入到列表中
      if(!!app.player) {
        app.player.list.add(user, socket);
        await autoJoinSocketRoom.call(app, socket);
      }

      cb({result: true, info: user.getInfo(true)});

      // 更新登录信息
      user.last_login = new Date();
      user.last_ip = ip;
      await user.saveAsync();

      // 添加登录记录
      await db.models.player_login_log.createAsync({
        user_uuid: user.uuid,
        user_name: user.username,
        type: isApp ? 'app_token' : 'token',
        channel,
        ip,
        platform,
        device_info: {
          userAgent: socket.handshake.headers['user-agent'],
          acceptLanguage: socket.handshake.headers['accept-language'],
        },
        is_success: true,
        token: isApp ? user.app_token : user.token,
      });
    }
  }catch(e) {
    cb({result: false, msg: e.toString()});
    debug('login with token fail. received data %o \n%O', data, e);
  }
}

exports.register = async function register(data, cb, db) {
  let app = this.app;
  let socket = this.socket;

  if(typeof data === 'string') {
    data = JSON.parse(data);
  }

  let username = data.username;
  let password = data.password;

  if(username.length > 18) {
    throw '注册失败!用户名过长';
  }

  if(!username || !password) {
    debug('register fail, miss necessary parameter: %o', data);
    throw '缺少必要参数';
  }

  let modelUser = db.models.player_user;
  let user = await modelUser.findOne({
    where: {username}
  });

  if(!!user) {
    debug('register failed!user %s has been existed', user.username);
    throw '用户名已存在';
  }

  let results = await modelUser.create({
    username,
    password:md5(password)}
  );
  debug('register success: %o', results);
  return { results }
}

exports.getInfo = async function getUserInfo(data, cb, db) {
  let app = this.app;
  let socket = this.socket;
  let type = data.type || 'self';
  let uuid = data.uuid;

  if(!type) {
    throw '参数不全';
  }

  if(type === 'self') {
    let player = app.player.list.find(socket);
    if(!!player) {
      cb({result: true, info: player.user});
    }else {
      cb({result: false, msg: '用户不存在，请检查登录状态'});
    }
  }else if(type === 'user') {
    let user = await db.models.player_user.findOne({where: {uuid}});
    if(!!user) {
      return {
        info: user.getInfo()
      }
    }else{
      throw '用户不存在';
    }
  }else {
    throw '未知的类型';
  }
}

exports.updateInfo = async function updateInfo(data, cb, db) {
  let app = this.app;
  let socket = this.socket;

  try {
    let player = app.player.list.find(socket);
    if(!player) {
      throw '用户不存在，请检查登录状态';
    }

    let user_id = player.user.id;

    let user = await db.models.player_user.getAsync(user_id);
    // TODO: 检测用户信息合法性(如禁止敏感字符作为昵称)
    user.updateInfo(data);
    await user.saveAsync();
    cb({result: true, user: user.getInfo(true)});
  }catch (err) {
    cb({result: false, msg: err.toString()})
  }
}

exports.changePassword = async function changePassword(data, cb, db) {
  let app = this.app;
  let socket = this.socket;

  try {
    let player = app.player.list.find(socket);
    if(!player) {
      cb({result: false, msg: '用户不存在，请检查登录状态'});
      return;
    }

    let {oldPassword, newPassword} = data;
    oldPassword = md5(oldPassword);
    newPassword = md5(newPassword);

    let user_id = player.user.id;
    let user = await db.models.player_user.getAsync(user_id);
    if(user.password !== oldPassword) {
      cb({result: false, msg: '原密码不正确'});
      return;
    }

    user.password = newPassword;
    await user.saveAsync();
    cb({result: true, user: user.getInfo(true)});
  }catch (err) {
    cb({result: false, msg: err.toString()})
  }
}

exports.logout = async function logout(data, cb, db) {
  const app = this.app;
  const socket = this.socket;
  const {uuid, token, isApp} = data;

  if(!uuid || !token) {
    throw '参数不全'
  }

  let where = {uuid};
  if(isApp) {
    where.app_token = token;
  }else {
    where.token = token;
  }

  let user = await db.models.player_user.findOne({where});
  if(!user) {
    debug('logout fail, try to login %s', uuid);
    throw 'TOKEN错误或过期';
  } else {
    debug('logout success!user %s has been logout', user.uuid);
    user.token = '';
    await user.save();

    // 从列表中移除
    if(!!app.player) {
      app.player.list.remove(user.uuid);
    }

    return true;
  }
}

exports.findUser = function findUser(data, cb) {
  let app = this.app;
  let socket = this.socket;

  try {
    let {text, type} = data;
    if(!!text && !!type) {
      app.storage.connect(function(db) {
        let User = db.models.player_user;
        if(type === 'uuid') {
          User.find({uuid: text}, 10, function(err, users) {
            if(!err) {
              let results = [];
              for (user of users) {
                results.push(user.getInfo());
              }
              cb({result: true, results});
            }else {
              cb({result: false, msg: err.toString()})
            }
          });
        }else if(type === 'username') {
          User.find().limit(10).where(`username like '%${text}%'`).all(function(err, users) {
            if(!err) {
              let results = [];
              for (user of users) {
                results.push(user.getInfo());
              }
              cb({result: true, results});
            }else {
              cb({result: false, msg: err.toString()});
            }
          })
        }else if(type === 'nickname') {
          User.find().limit(10).where(`nickname like '%${text}%'`).all(function(err, users) {
            if(!err) {
              let results = [];
              for (user of users) {
                results.push(user.getInfo());
              }
              cb({result: true, results});
            }else {
              cb({result: false, msg: err.toString()});
            }
          })
        }
      })
    }else {
      cb({result: false, msg: '缺少参数'});
    }
  }catch(err) {
    debug('findUser fail. received data %o \n%O', data, err);
  }
}

exports.addFriend = function addFriend(data, cb) {
  let app = this.app;
  let socket = this.socket;

  try {
    let player = app.player.list.find(socket);
    if(!!player) {
      let uuid1 = player.user.uuid;
      let uuid2 = data.uuid;
      if(!!uuid1 && !!uuid2) {
        app.player.makeFriend(uuid1, uuid2, function(err) {
          if(!!err) {
            debug('addFriend with %s and %s, throw error: %s', uuid1, uuid2, err.toString())
            cb({result: false, msg: '添加好友失败，可能是已经被添加了'});
          }else {
            cb({result: true})
          }
        });
      }else {
        cb({result: false, msg: '缺少参数'});
      }
    }else {
      cb({result: false, msg: '用户状态异常'});
    }
  }catch(err) {
    debug('add friend fail. received data %o \n%O', data, e);
  }
}

exports.getFriends = function getFriends(data, cb) {
  let app = this.app;
  let socket = this.socket;

  try {
    let player = app.player.list.find(socket);
    if(!!player) {
      let uuid = player.user.uuid;
      app.player.getFriends(uuid, function(err, list) {
        if(!!err) {
          cb({result: false, msg: '获取好友列表失败'});
        }else {
          list = list.map((i) => i.getInfo());
          cb({result: true, list});
        }
      })
    }else {
      cb({result: false, msg: '用户状态异常'});
    }
  }catch(err) {
    debug('get friends fail. received data %o \n%O', data, e);
  }
}

exports.sendFriendInvite = function sendFriendInvite(data, cb) {
  let app = this.app;
  let socket = this.socket;

  try {
    let player = app.player.list.find(socket);
    if(!!player) {
      let from_uuid = player.user.uuid;
      let to_uuid = data.to;
      app.storage.connect(function(db) {
        const Invite = db.models.player_invite;
        Invite.exists({from_uuid, to_uuid, is_agree: false, is_refuse: false}, function(err, inviteIsExist) {
          if(!inviteIsExist) {
            Invite.create({from_uuid, to_uuid}, function(err, invite) {
              if(!!err) {
                cb({result: false, msg: err.toString()})
              }else{
                let to_player = app.player.list.get(to_uuid);
                if(!!to_player) {
                  let socket = to_player.socket;
                  socket.emit('player::invite', invite)
                }

                if(app.chat && app.chat.sendMsg) {
                  // 发送系统信息
                  let msg = `${player.user.nickname||player.user.username} 想添加您为好友`;
                  app.chat.sendSystemMsg(to_uuid, 'friendInvite', '好友邀请', msg, {invite});
                }

                cb({result: true, invite});
              }
            })
          }else {
            cb({result: false, msg: '重复请求'});
          }
        })
      });
    }else {
      cb({result: false, msg: '用户状态异常'});
    }
  }catch(err) {
    debug('send friends invite fail. received data %o \n%O', data, e);
  }
}

exports.refuseFriendInvite = function refuseFriendInvite(data, cb) {
  let app = this.app;
  let socket = this.socket;

  try {
    let player = app.player.list.find(socket);
    if(!!player) {
      let playerUUID = player.uuid;
      let inviteUUID = data.uuid;
      app.storage.connect(function(db) {
        const Invite = db.models.player_invite;
        Invite.one({uuid: inviteUUID, to_uuid: playerUUID}, function(err, invite) {
          if(!!err) {
            debug('refuseFriendInvite failed: %O', err);
            cb({result: false, msg: '拒绝失败'});
          }else {
            if(!!invite) {
              invite.is_refuse = true;
              invite.save(function (err) {
                if(!!err) {
                  debug('refuseFriendInvite save data failed: %O', err);
                  cb({result: false, msg: '拒绝失败'});
                }else {
                  cb({result: true, res: invite});
                }
              })
            }else {
              cb({result: false, msg: '拒绝失败: 该请求不存在'});
            }
          }
        })
      })
    }else {
      cb({result: false, msg: '用户状态异常'});
    }
  }catch(err) {
    debug('refuse friends invite fail. received data %o \n%O', data, e);
  }
}

exports.agreeFriendInvite = async function agreeFriendInvite(data, cb, db) {
  let app = this.app;
  let socket = this.socket;

  let player = app.player.list.find(socket);
  if(!player) {
    throw '用户状态异常'
  }

  let inviteUUID = data.uuid;
  let invite = await db.models.player_invite.oneAsync({uuid: inviteUUID, to_uuid:player.uuid});
  invite.is_agree = true;
  await db.transactionAsync(async () => {
    await invite.saveAsync();
    // 设定好友关系
    let uuid1 = invite.from_uuid;
    let uuid2 = invite.to_uuid;
    await app.player.makeFriendAsync(uuid1, uuid2);

    // 发送更新好友的通知
    let player1 = app.player.list.get(uuid1);
    if(player1) {
      player1.socket.emit('player::addFriend', {uuid: uuid2});
    }
  })

  return {invite};
}

exports.getFriendsInvite = function getFriendsInvite(data, cb) {
  let app = this.app;
  let socket = this.socket;

  try {
    let player = app.player.list.find(socket);
    if(!!player) {
      let uuid = player.user.uuid;
      app.storage.connect(function(db) {
        const Invite = db.models.player_invite;
        Invite.find({
          to_uuid: uuid,
          is_agree: false,
          is_refuse: false
        }, function(err, res) {
          if(!!err) {
            debug('getFriendsInvite Error: %O', err);
            cb({result: false, msg: '数据库异常'});
          }else {
            cb({result: true, res});
          }
        })
      });
    }else {
      cb({result: false, msg: '用户状态异常'});
    }
  }catch(err) {
    debug('get friends invite fail. received data %o \n%O', data, e);
  }
}

// 检查用户是否在线
exports.checkUserOnline = async function checkUserOnline(data, cb, db) {
  let app = this.app;
  let socket = this.socket;

  let uuid = data.uuid;
  if(!uuid) {
    throw '缺少必要参数';
  }
  let player = app.player.list.get(uuid);
  return {
    isOnline: !!player
  }
}

exports.getSettings = async function getSettings(data, cb, db) {
  let app = this.app;
  let socket = this.socket;

  let player = app.player.list.find(socket);
  if(!player) {
    throw '当前用户不存在';
  }
  let uuid = player.uuid;

  let settings = await db.models.player_settings.oneAsync({user_uuid: uuid});

  if(!settings) {
    // 没有记录过用户设置
    return {
      userSettings: {},
      systemSettings: {},
    }
  }

  return {
    userSettings: settings.user_settings || {},
    systemSettings: settings.system_settings || {},
  }
}

exports.saveSettings = async function saveSettings(data, cb, db) {
  let app = this.app;
  let socket = this.socket;

  let { userSettings, systemSettings } = data;

  let player = app.player.list.find(socket);
  if(!player) {
    throw '当前用户不存在';
  }
  let uuid = player.uuid;

  let settings = await db.models.player_settings.oneAsync({user_uuid: uuid});
  if(!settings) {
    settings = await db.models.player_settings.createAsync({
      user_uuid: uuid,
      user_settings: userSettings || {},
      system_settings: systemSettings || {},
    });
  }else {
    settings.user_settings = Object.assign({}, settings.user_settings, userSettings);
    settings.system_settings = Object.assign({}, settings.system_settings, systemSettings);
    await settings.saveAsync();
  }

  return {
    userSettings: settings.user_settings,
    systemSettings: settings.system_settings,
  }
}
