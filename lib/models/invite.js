const uuid = require('uuid/v1');

module.exports = function Invite(orm, db) {
  let Invite = db.define('player_invite', {
    uuid: {type: 'text', required: false},
    from_uuid: {type: 'text', required: true},
    to_uuid: {type: 'text', required: true},
    is_agree: {type: 'boolean', defaultValue: false},
    is_refuse: {type: 'boolean', defaultValue: false},
    createAt: {type: 'date', time: true, required: false},
    updateAt: {type: 'date', time: true, required: false},
  }, {
    validations: {
      uuid: orm.enforce.unique('uuid already taken!'),
    },
    hooks: {
      beforeCreate: function(next) {
        if (!this.uuid) {
  				this.uuid = uuid();
  			}
        if (!this.createAt) {
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

    }
  });

  return Invite;
}
