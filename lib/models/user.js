const uuid = require('uuid/v1');

module.exports = function User(orm, db) {
  return db.define('core_user', {
    username: {type: 'text', required: true},
    password: {type: 'text', required: true},
    uuid: {type: 'text', required: true, defaultValue: uuid()},
    last_login: {type: 'date'},
    selected_actor: {type: 'integer'}
  }, {
    methods: {
      getSelectedActor: function(cb) {
        let selectedActorId = this.selected_actor;
        if(!!db && !!selectedActorId) {
          selectedActorId = parseInt(selectedActorId);
          db.models.core_actor.get(selectedActorId, cb);
        }else {
          cb(new Error('data error'), null);
        }
      }
    }
  });
}
