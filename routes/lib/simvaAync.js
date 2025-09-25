const Simva  = require('./simva');
// Automatically wrap all Simva.xxx functions into promise-based versions
const SimvaAsync = {};

for (const key of Object.keys(Simva)) {
  if (typeof Simva[key] === "function") {
    SimvaAsync[key] = (...params) => {
      return new Promise((resolve, reject) => {
        Simva[key](...params, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
    };
  }
}