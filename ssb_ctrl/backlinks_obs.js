var nest = require('depnest')
var Value = require('mutant/value')
var computed = require('mutant/computed')
var Abortable = require('pull-abortable')
var resolve = require('mutant/resolve')
var pull = require('pull-stream')
var onceIdle = require('mutant/once-idle')

var patchCore = require("patchcore")
var combine = require("depject")

/**
 * Mostly copied and pasted from backlinks.obs.for in the patchcore library
 * but with an optional parameter to filter messages
 */
module.exports = () => {

  var backlinksObs = {
    needs: nest({"backlinks.obs.filter": "first"})
  }

  var api = combine([backlinksObs, patchCore]);
  return api.backlinks.obs.filter[0];
}
