const m = require('mithril');
const { Chessground } = require('chessground');
const timeAgo = require('./timeAgo')();

module.exports = (gameSummaryObservable, summary, identPerspective, opts) => {
  let chessground = null;
  let observables = [];
  let lastActivityTimestamp = summary.lastUpdateTime;

  // An observer might not be in the 'players' list so we need a default
  // perspective of white for them.
  const playerColour = (summary.players[identPerspective]
    && summary.players[identPerspective].colour) ? summary.players[identPerspective].colour : 'white';

  function renderPlayerName(player) {
    return m(`a[href=/player/${btoa(player.id)}]`, {
      class: 'ssb-chess-miniboard-name',
      oncreate: m.route.link,
    },
    player.name.substring(0, 10));
  }

  function renderSummaryBottom() {
    if (!(opts && opts.small)) {
      const coloursNames = summary.coloursToPlayer();
      const otherPlayerColour = playerColour == 'white' ? 'black' : 'white';

      const leftPlayer = coloursNames[playerColour];
      const rightPlayer = coloursNames[otherPlayerColour];

      return m('div', {
        class: 'ssb-chess-miniboard-bottom',
      }, [m('center', {
        class: 'ssb-chess-miniboard-name',
      }, renderPlayerName(leftPlayer)),
      m('small', {
        class: 'ssb-chess-miniboard-time-ago',
      }, lastActivityTimestamp ? timeAgo(lastActivityTimestamp)() : ''),
      m('center', {
        class: 'ssb-chess-miniboard-name',
      }, renderPlayerName(rightPlayer)),
      ]);
    }
    return m('div');
  }

  function renderSummary() {
    const observing = Object.keys(summary.players).indexOf(identPerspective) === -1;
    const boardSizeClass = opts && opts.small ? 'ssb-chess-board-small' : 'ssb-chess-board-medium';

    return m('div', {
      class: 'ssb-chess-miniboard ssb-chess-board-background-blue3 merida',
    }, [
      m(`${'a[href=/games/'}${btoa(summary.gameId)}?observing=${observing}]`, {
        class: `ssb-chessground-container cg-board-wrap ${boardSizeClass}`,
        title: summary.gameId,
        id: summary.gameId,
        oncreate: m.route.link,
      }), renderSummaryBottom(),
    ]);
  }

  function summaryToChessgroundConfig(s) {
    const config = {
      fen: s.fen,
      viewOnly: true,
      orientation: playerColour,
      turnColor: s.players[s.toMove].colour,
      check: s.check,
      coordinates: false,
    };

    if (s.lastMove) {
      config.lastMove = [s.lastMove.orig, s.lastMove.dest];
    }

    return config;
  }

  return {
    view() {
      return renderSummary();
    },
    oncreate(vNode) {
      // This lifecycle event tells us that the DOM is ready. That means we
      // can attach chessground to our chessground container element that was
      // prepared for it during the 'view' lifecycle method.

      const config = summaryToChessgroundConfig(summary);

      const { dom } = vNode;
      const chessGroundParent = dom.querySelector('.ssb-chessground-container');
      chessground = Chessground(chessGroundParent, config);

      // Listen for game updates

      const situationObs = gameSummaryObservable((newSummary) => {
        const newConfig = summaryToChessgroundConfig(newSummary);
        chessground.set(newConfig);
        lastActivityTimestamp = newSummary.lastUpdateTime;
      });

      observables.push(situationObs);
    },
    onremove() {
      if (chessground) {
        chessground.destroy();
      }

      observables.forEach(w => w());
      observables = [];
    },
  };
};
