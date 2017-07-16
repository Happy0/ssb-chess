const PubSub = require("pubsub-js");
var m = require("mithril");

module.exports = () => {

  var currentlyLoading = true;

  function renderLoadingBar() {
    var loadingText = m('div', {
      className: "ssb-chess-loading-text"
    }, 'Loading games');
    var loadingSpinner = m('div', {
      className: "ssb-chess-loader"
    });

    return m('div', {
      id: "ssb-chess-loading-bar",
      className: "ssb-chess-loading"
    }, [loadingText, loadingSpinner]);
  }

  return {
    oninit: () => {
      this.loadedListener = PubSub.subscribe("ssb_chess_games_loaded", (msg, data) => {
        currentlyLoading = false;

        // *sigh* I couldn't get m.redraw() to call view for some reason
        document.getElementById("ssb-chess-loading-bar").className = "ssb-chess-loading-hide";
      });
    },
    view: () => renderLoadingBar(),
    onremove: () => {
      PubSub.unsubscribe(this.loadedListener);
    }
  }
}
