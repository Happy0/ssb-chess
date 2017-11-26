var patchCore = require("patchcore")
var combine = require("depject")

module.exports = () => {

  var backlinksObs = {
    "needs": {
      "backlinks.obs.filter": true
    }
  }

  var api = combine([backlinksObs, patchCore]);
  return api.backlinks.obs.filter[0];
}
