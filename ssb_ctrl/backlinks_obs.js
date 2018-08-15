const nest = require('depnest');
const patchCore = require('patchcore');
const combine = require('depject');

/**
 * Mostly copied and pasted from backlinks.obs.for in the patchcore library
 * but with an optional parameter to filter messages
 */
module.exports = () => {
  const backlinksObs = {
    needs: nest({ 'backlinks.obs.filter': 'first' }),
  };

  const api = combine([backlinksObs, patchCore]);
  return api.backlinks.obs.filter[0];
};
