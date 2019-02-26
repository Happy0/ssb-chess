const nest = require('depnest');
const patchCore = require('patchcore');
const combine = require('depject');

/**
 * Mostly copied and pasted from backlinks.obs.for in the patchcore library
 * but with an optional parameter to filter messages
 */
module.exports = () => {
  const backlinksObs = {
    needs: nest(
      {
        'backlinks.obs.filter': 'first',
        'backlinks.obs.cache': 'first',
      },
    ),
  };

  const api = combine([backlinksObs, patchCore]);

  const Cache = api.backlinks.obs.cache[0];

  // Cache the backlinks observables for 1 minute once there are no subscribers
  // to the observable
  const cache = Cache(60000);

  const cachedBacklinksFn = api.backlinks.obs.filter[0];

  function getCachedFilteredBacklinks(id, opts) {
    opts.cache = cache;
    return cachedBacklinksFn(id, opts);
  }

  return {
    getFilteredBackLinks: getCachedFilteredBacklinks
  }
};
