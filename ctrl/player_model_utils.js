module.exports = () => {

  function coloursToNames(json) {
    var ret = {};
    for (var key in json) {
      ret[json[key].colour] = json[key].name;
    }
    return ret;
  }

  function coloursToPlayer(json) {
    var ret = {};
    for (var key in json) {
      ret[json[key].colour] = json[key];
    }
    return ret;
  }

  return {
    coloursToNames: coloursToNames,
    coloursToPlayer: coloursToPlayer
  }
}
