var m = require("mithril");

module.exports = () => {

  return {

    view: function(ctrl) {
      const gameId = atob(ctrl.attrs.gameId);
      return m('div', gameId);
    }
  }

}
