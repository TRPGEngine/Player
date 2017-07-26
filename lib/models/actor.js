const uuid = require('uuid/v1');

module.exports = function Actor(orm, db) {
  var Actor = db.define('core_actor', {
    name: {type: 'text', required: true},
    uuid: {type: 'text', required: true, defaultValue: uuid()},
    info: {type: 'object'}
  }, {
    methods: {

    }
  });
  Actor.hasOne('user');

  return Actor;
}
