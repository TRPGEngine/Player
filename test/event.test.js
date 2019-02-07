const event = require('../lib/event');
const md5 = require('../md5');
const testEvent = global.testEvent;

test('login should be ok', async () => {
  let ret = await testEvent(event.login, {
    username: 'admin1',
    password: md5('admin')
  })

  expect(ret.result).toBe(true);
  expect(ret).toHaveProperty('info');
  expect(ret.info.username).toBe('admin1');
});
