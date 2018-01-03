var Value = require('mutant/value')
var onceTrue = require('mutant/once-true');

module.exports = () => {

  function promiseToMutant(promise) {
    var mutant = Value();

    promise.then(mutant.set).catch(err => {throw err} /* gadz */);

    return mutant;
  }

  function mutantToPromise(mutant) {
    return new Promise ( (resolve, reject) => {
      try {
        onceTrue(mutant, v => {
          resolve(v);
        })
      } catch (e) {
        reject(e);
      }

    });
  }

  return {
    promiseToMutant: promiseToMutant,
    mutantToPromise: mutantToPromise
  }
}
