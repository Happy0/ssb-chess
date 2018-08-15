const Value = require('mutant/value');
const onceTrue = require('mutant/once-true');

module.exports = () => {
  function promiseToMutant(promise) {
    const mutant = Value();

    promise.then(mutant.set).catch((err) => { throw err; } /* gadz */);

    return mutant;
  }

  function mutantToPromise(mutant) {
    return new Promise((resolve, reject) => {
      try {
        onceTrue(mutant, (v) => {
          resolve(v);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  return {
    promiseToMutant,
    mutantToPromise,
  };
};
