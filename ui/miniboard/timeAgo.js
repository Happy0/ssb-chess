const patchCore = require('patchcore');
const combine = require('depject');
const nest = require('depnest');

module.exports = () => {
  const timeAgo = {
    needs: nest({ 'lib.obs.timeAgo': 'first' }),
  };

  const api = combine([timeAgo, patchCore]);

  return api.lib.obs.timeAgo[0];
};
