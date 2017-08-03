var Value = require('mutant/value')

module.exports = () => {

  function promiseToMutant(promise) {
    var mutant = Value();

    promise.then(mutant.set).catch(err => {throw err} /* gadz */);

    return mutant;
  }

  return {
    promiseToMutant: promiseToMutant
  }
}
