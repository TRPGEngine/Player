const uuid = require('uuid/v1');

module.exports = function Invite(orm, db) {
  let Invite = db.define('player_invite', {
    uuid: {type: 'text', required: true},
    from_uuid: {type: 'text', required: true},
    to_uuid: {type: 'text', required: true},
    is_agree: {type: 'boolean', defaultValue: false},
    is_refuse: {type: 'boolean', defaultValue: false},
    createAt: {type: 'text', required: false},
  }, {
    validations: {
      uuid: orm.enforce.unique('uuid already taken!'),
      to_uuid: orm.enforce.unique({ scope: ['from_uuid'] }, 'Invite only send once to same player')
    },
    hooks: {
      beforeCreate: function(next) {
        if (!this.uuid) {
  				this.uuid = uuid();
  			}
  			return next();
      }
    },
    methods: {

    }
  });

  return Invite;
}
