const logger = require('../../logger');
const Simva  = require('./simva');
// Automatically wrap all Simva.xxx functions into promise-based versions
// Robust Promise wrapper for Simva
const SimvaAsync = new Proxy({}, {
  get(target, prop) {
    if (typeof Simva[prop] === "function") {
      // Return a promise-wrapped version of the function
      return (...params) => {
        return new Promise((resolve, reject) => {
          Simva[prop](...params, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });
      };
    } else {
      // Throw clear error if function doesn't exist
      throw new Error(`SimvaAsync: '${prop}' is not a valid Simva function.`);
    }
  }
});

module.exports=SimvaAsync;