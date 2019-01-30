const md5 = require('../md5');

exports.login = async function(client, chai) {
  let data = await client.emit('player::login', {
    username: 'admin1',
    password: md5('admin'),
  });

  chai.expect(data.info.username).to.equal('admin1');

  client.setGlobal('uuid', data.info.uuid);
  client.setGlobal('token', data.info.token);
}

exports.loginWithToken = async function(client, chai) {
  const uuid = client.getGlobal('uuid');
  const token = client.getGlobal('token');

  let data = await client.emit('player::loginWithToken', {
    uuid,
    token
  })

  chai.expect(data.info.uuid).to.equal(uuid);
  chai.expect(data.info.token).to.equal(token);
}

exports.register = async function(client, chai) {
  const random = parseInt(Math.random() * 1e5);
  const username = 'testuser' + random;
  let data = await client.emit('player::register', {
    username,
    password: md5(random)
  })

  chai.expect(data.results.username).to.equal(username);
  chai.expect(data.results.password).to.equal(md5(md5(random)));
}

exports.getInfo = async function(client, chai) {
  const uuid = client.getGlobal('uuid');
  const token = client.getGlobal('token');

  let selfData = await client.emit('player::getInfo', {});
  chai.expect(selfData.info.uuid).to.equal(uuid);
  chai.expect(selfData.info.token).to.equal(token);

  let userData = await client.emit('player::getInfo', {
    type: 'user',
    uuid
  })
  chai.expect(userData.info.uuid).to.equal(uuid);
  chai.expect(userData.info.token).to.be.empty;
}

exports.updateInfo = async function(client, chai) {
  const token = client.getGlobal('token');
  const random = String(Math.random());

  let data = await client.emit('player::updateInfo', {
    sign: random,
    token: random
  })
  chai.expect(data.user.sign).to.equal(random);
  chai.expect(data.user.token, 'token不能被更新').to.equal(token);
  chai.expect(data.user.token).to.not.equal(random);
}
