const Value = require("mutant/value");
const m = require("mithril");
const watch = require("mutant/watch");

const R = require("ramda");

// todo: move this file somewhere more appropriate :P
const PlayerModelUtils = require("../../ctrl/player_model_utils")();

module.exports = (gameObservable, myIdent) => {

  var watchesToClear = [];

  var moveNumberSelected = "live";
  const moveSelectedObservable = Value(moveNumberSelected);

  var pgnMoves = [];
  var status = null;
  var players = [];

  var latestMove = 0;

  function renderPlayerName(player) {
    return m('a[href=/player/' + btoa(player.id) + ']', {
        oncreate: m.route.link
      },
      player.name.substring(0, 10));
  }

  function renderPlayers() {
    if (!players || players.length === 0 ) {
      return m('div', {}, "");
    }

    var mePlaying = players[myIdent];
    var myPerspectiveColour = mePlaying ? mePlaying.colour : "white";

    var coloursToPlayers = PlayerModelUtils.coloursToPlayer(players);

    var whitePlayer = coloursToPlayers["white"];
    var blackPlayer = coloursToPlayers["black"];
    return m('div', {class: "ssb-chess-history-player-container"}, [
      m('div', {class: "ssb-chess-history-player"}, renderPlayerName(whitePlayer)),
      m('div', {class: "ssb-chess-history-player"}, renderPlayerName(blackPlayer))
    ]);
  }

  function renderStatus() {
    if (!status) {
      return m('div', "");
    }

    switch (status.status) {
      case "invited":
        return  m('div', {class: "ssb-chess-status-text"}, "Awaiting invite being accepted.");
      case "resigned":
        return m('div', {class: "ssb-chess-status-text"},
          players[status.winner].name + " wins by resignation.");
      case "mate":
        return m('div', {class: "ssb-chess-status-text"},
          players[status.winner].name + " wins.");
      case "draw":
        return m('div', {class: "ssb-chess-status-text"}, "Draw.")
      default:
        return m('div');
    }

  }

  function renderHistory() {
    return m('div', {
      class: ''
    }, [renderPlayers(), renderMoveHistory(), renderStatus()]);
  }

  function renderHalfMove(pgn, moveNumber) {
    const clickHandler = () => {

      if (moveNumber === latestMove) {
        moveNumberSelected = "live";
      } else {
        moveNumberSelected = moveNumber;
      }

      moveSelectedObservable.set(moveNumberSelected);
    }

    var highlightClass = ((moveNumberSelected === moveNumber) ||
      (moveNumber === latestMove && moveNumberSelected === "live")) ? " ssb-chess-pgn-move-selected" : "";

    return m('div', {
      class: "ssb-chess-pgn-cell" + highlightClass,
      onclick: clickHandler
    }, pgn);
  }

  function renderMoveHistory() {
    const halves = R.splitEvery(2, pgnMoves);

    return m('div', {class: 'ssb-chess-pgn-moves-list'},
      halves.map((half, halfNumber) => m('div', {
        class: 'ssb-chess-pgn-move'
    }, [renderHalfMove(half[0], ((halfNumber + 1) * 2) - 1), renderHalfMove(half[1], (halfNumber + 1) * 2)])));
  }

  function hasChatInputBoxFocused() {
    return document.activeElement.className.indexOf("ssb-embedded-chat-input-box") > -1;
  }

  function handleArrowKeys() {
    const left = 37;
    const up = 38;
    const right = 39;
    const down = 40;

    document.onkeydown = function(evt) {
      if (hasChatInputBoxFocused()) {
        // When a user is editting text in the chat box and moving their cursor with the
        // arrow keys, we don't want to scroll through the history
        return;
      }

      evt = evt || window.event;
      if (evt.keyCode === left && (moveNumberSelected !== 0)) {
        if (moveNumberSelected === "live") {
          moveNumberSelected = latestMove;
        }

        moveNumberSelected = moveNumberSelected - 1;
      } else if (evt.keyCode === right && moveNumberSelected !== "live") {
        moveNumberSelected = moveNumberSelected + 1;

        if (moveNumberSelected === latestMove) {
          moveNumberSelected = "live";
        }

      } else if (evt.keyCode === up) {
        moveNumberSelected = 0;
      } else if (evt.keyCode === down) {
        moveNumberSelected = "live";
      }

      var allArrowKeys = [left, up, right, down];

      if (allArrowKeys.indexOf(evt.keyCode) !== -1) {
        moveSelectedObservable.set(moveNumberSelected);
      }

      m.redraw();
    }
  }

  /**
   * This observable changes as the user selects old positions in the move
   * history to view the move of. The value emitted is the ply number of the
   * move
   */
  function getMoveSelectedObservable() {
    return moveSelectedObservable;
  }

  function scrollToBottomIfLive() {
    if (moveNumberSelected === "live") {
      var moveListElement = document.getElementsByClassName("ssb-chess-pgn-moves-list")[0];
      if (moveListElement) {
        moveListElement.scrollTop = moveListElement.scrollHeight;
      }
    }
  }

  function updateModelOnGameUpdates() {
    var w = watch(gameObservable, (situation) => {
      if (situation) {
        pgnMoves = situation.pgnMoves;
        status = situation.status;
        players = situation.players;

        latestMove = situation.ply;
      }
    });

    watchesToClear.push(w);
  }

  function goToLiveMode() {
    moveNumberSelected = "live";
    moveSelectedObservable.set(moveNumberSelected);
  }

  function scrollToBottomOnGameUpdates() {
    var w = watch(gameObservable, (situation) => {
      scrollToBottomIfLive();
      m.redraw();
    });

    watchesToClear.push(w);
  }

  return {
    view: renderHistory,
    oninit: () => {
      updateModelOnGameUpdates();
    },
    oncreate: () => {
      handleArrowKeys();
      scrollToBottomOnGameUpdates();
    },
    onremove: () => {
      watchesToClear.forEach(w => w());
      watchesToClear = [];
    },
    getMoveSelectedObservable: getMoveSelectedObservable,
    goToLiveMode: goToLiveMode
  }

}
