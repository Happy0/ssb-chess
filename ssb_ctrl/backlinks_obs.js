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
    needs: nest({
      'sbot.pull.backlinks': 'first'
    }),

    gives: nest('backlinks.obs.filter.for', true),

    create: function(api) {
      var cache = {}

      // cycle remove sets for fast cleanup
      var newRemove = new Set()
      var oldRemove = new Set()

      // run cache cleanup every 5 seconds
      // an item will be removed from cache between 5 - 10 seconds after release
      // this ensures that the data is still available for a page reload
      var timer = setInterval(() => {
        oldRemove.forEach(id => {
          if (cache[id]) {
            cache[id].destroy()
            delete cache[id]
          }
        })
        oldRemove.clear()

        // cycle
        var hold = oldRemove
        oldRemove = newRemove
        newRemove = hold
      }, 5e3)

      if (timer.unref) timer.unref()

      return nest({
        'backlinks.obs.filter.for': (id, opts) => backlinks(id, opts)
      })

      function backlinks(id, opts) {
        if (!cache[id]) {
          var sync = Value(false)
          var aborter = Abortable()
          var collection = Value([])

          var filter = opts && opts.filter ? opts.filter : () => true

          // try not to saturate the thread
          onceIdle(() => {
            pull(
              api.sbot.pull.backlinks({
                query: [{
                  $filter: {
                    dest: id
                  }
                }],
                index: 'DTA', // use asserted timestamps
                live: true
              }),
              aborter,
              pull.drain((msg) => {
                if (msg.sync) {
                  sync.set(true)
                } else {
                  // This should really be a 'through' in the pull-stream,
                  // but I couldn't get it working for some reason
                  if (filter(msg)) {
                    var value = resolve(collection)
                    value.push(msg)
                    collection.set(value)
                  }
                }
              })
            )
          })

          cache[id] = computed([collection], x => x, {
            onListen: () => use(id),
            onUnlisten: () => release(id)
          })

          cache[id].destroy = aborter.abort
          cache[id].sync = sync
        }
        return cache[id]
      }

      function use(id) {
        newRemove.delete(id)
        oldRemove.delete(id)
      }

      function release(id) {
        newRemove.add(id)
      }
    }
  }

  var api = combine([backlinksObs, patchCore]);
  return api.backlinks.obs.filter.for[0];
}
