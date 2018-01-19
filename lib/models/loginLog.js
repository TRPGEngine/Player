module.exports = function LoginLog(orm, db) {
  let LoginLog = db.define('player_login_log', {
    user_uuid: {type: 'text'},
    user_name: {type: 'text'},
    type: {type: 'enum', values: ['standard', 'token'], required: true},
    ip: {type: 'text'},
    platform: {type: 'text'},
    device_info: {type: 'object'},
    is_success: {type: 'boolean'},
    token: {type: 'text'},
    createAt: {type: 'date'},
  }, {
    hooks: {
      beforeCreate: function(next) {
        if (!this.createAt) {
  				this.createAt = new Date();
  			}
  			return next();
      }
    },
    methods: {

    }
  });

  return LoginLog;
}