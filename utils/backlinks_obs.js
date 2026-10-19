const { pull } = require("pull-stream");
const Scan = require('pull-scan');
const Value = require('mutant/value')
const Pauser = require('pull-pause');
const computed = require('mutant/computed')

/**
 * Mostly copied and pasted from backlinks.obs.for in the patchcore library
 * but with an optional parameter to filter messages
 */
module.exports = (dataAccess) => {
  
  function getFilteredBackLinks(id, opts) {
    const obs = Value([]);
    const sync = Value(false);

    const pauser = Pauser()
    const filter = opts.filter;

    const state = {
      result: [],
      live: false
    }

    const source = pull(
      dataAccess.allGameMessages(id, true),
      pauser,
      pull.filter(msg => msg.sync || filter(msg)),
      Scan( (acc, msg) => {
       // console.log(msg);
        if (msg.sync) {
          acc.live = true;
        } else {
          acc.result.push(msg)
        }

        return acc;
      }, state)
    );

    pull(source, pull.drain(state => {
        obs.set(state.result)
        sync.set(state.live)
      })
    );

    const result = computed([obs], a => a, {
      onUnlisten: () => {
        return pauser.pause()
      },
      onListen: () => {
        pauser.resume()
      }
    })

    result.sync = sync;

    return result;
  }


  return {
    getFilteredBackLinks: getFilteredBackLinks
  }
};
