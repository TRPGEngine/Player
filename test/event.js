const md5 = require('../md5');

exports.login = async function(client, chai) {
  let data = await client.emit('player::login', {
    username: 'admin1',
    password: md5('admin'),
  });

  chai.expect(data.result).to.equal(true);
  chai.expect(data.info.username).to.equal('admin1');
}
