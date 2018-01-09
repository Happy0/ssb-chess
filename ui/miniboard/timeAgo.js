var patchCore = require('patchcore')
var combine = require('depject')
var nest = require('depnest')

module.exports = () => {

  var timeAgo = {
    needs: nest({"lib.obs.timeAgo": "first"})
  }

  var api = combine([timeAgo, patchCore]);

  return api.lib.obs.timeAgo[0]
}
