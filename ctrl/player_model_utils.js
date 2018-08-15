module.exports = () => {
  function coloursToNames(json) {
    const ret = {};

    Object.keys(json).forEach((key) => {
      ret[json[key].colour] = json[key].name;
    });
    return ret;
  }

  function coloursToPlayer(json) {
    const ret = {};
    Object.keys(json).forEach((key) => {
      ret[json[key].colour] = json[key];
    });
    return ret;
  }

  return {
    coloursToNames,
    coloursToPlayer,
  };
};
