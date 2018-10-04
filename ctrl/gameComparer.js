const _ = require('lodash');

module.exports = () => {
    function hasSameGames(list1, list2) {
        if (!list1 || !list2) {
          return false;
        }
    
        list1 = list1 || [];
        list2 = list2 || [];
    
        const list1ids = list1.map(a => a.gameId);
        const list2ids = list2.map(a => a.gameId);
    
        return _.isEmpty(_.xor(list1ids, list2ids));
    }

    return {
        hasSameGames
    }
}