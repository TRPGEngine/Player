module.exports = function(geetestObj, funcName, config) {
  return new Promise((resolve, reject) => {
    geetestObj[funcName](config, (err, data) => {
      if(err) {
        reject(err);
      }else {
        resolve(data);
      }
    })
  })
}
