module.exports = () => {

  return {
    controller: function() {
      return {id: m.route.param("gameId")};
    },
    view: function(ctrl) {
      m('div', "gamearooni");
    }
  }

}
