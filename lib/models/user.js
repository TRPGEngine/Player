const uuid = require('uuid/v1');

module.exports = function User(orm, db) {
  let User = db.define('player_user', {
    username: {type: 'text', required: true},
    password: {type: 'text', required: true},
    nickname: {type: 'text', required: false},
    avatar: {type: 'text', required: false},
    uuid: {type: 'text', required: false},
    last_login: {type: 'date', time: true},
    last_ip: {type: 'text'},
    createdAt: {type: 'date', time: true},
    updateAt: {type: 'date', required: false},
    token: {type: 'text'},
    app_token: {type: 'text'},
    sex: {type:'enum', values: ['男', '女', '其他', '保密'], defaultValue: '保密'},
    sign: {type: 'text'},
  }, {
    hooks: {
      beforeCreate: function(next) {
        if (!this.uuid) {
  				this.uuid = uuid();
  			}
        if(!this.createAt) {
          this.createAt = new Date();
        }
        if (!this.updateAt) {
  				this.updateAt = new Date();
  			}
  			return next();
      },
      beforeSave: function(next) {
				this.updateAt = new Date();
        return next();
      },
    },
    methods: {
      getName: function() {
        return this.nickname || this.username;
      },
      getInfo: function(includeToken = false) {
        return {
          username: this.username,
          nickname: this.nickname || this.username,
          uuid: this.uuid,
          last_login: this.last_login,
          createdAt: this.createdAt,
          id: this.id,
          avatar: this.avatar,
          token: includeToken ? this.token : '',
          app_token: includeToken ? this.app_token : '',
          sex: this.sex,
          sign: this.sign,
        }
      },
      updateInfo: function(data) {
        // 数据保护
        delete data.id;
        delete data.username;
        delete data.password;
        delete data.uuid;
        delete data.createAt;
        delete data.token;
        delete data.app_token;

        return Object.assign(this, data);
      },
    }
  });

  User.hasMany('friends', User, {}, {key: true});

  return User;
}
