module.exports = () => {
  function coloursToNames(json) {
    const ret = {};
    for (const key in json) {
      ret[json[key].colour] = json[key].name;
    }
    return ret;
  }

  function coloursToPlayer(json) {
    const ret = {};
    for (const key in json) {
      ret[json[key].colour] = json[key];
    }
    return ret;
  }

  return {
    coloursToNames,
    coloursToPlayer,
  };
};
