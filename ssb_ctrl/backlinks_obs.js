var patchCore = require("patchcore")
var combine = require("depject")

module.exports = () => {

  var backlinksObs = {
    "needs": {
      "backlinks.filter.obs": true
    }
  }

  var api = combine([backlinksObs, patchCore]);
  return api.backlinks.filter.obs[0];
}
