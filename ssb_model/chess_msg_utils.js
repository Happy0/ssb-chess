module.exports = () => {
  function winnerFromEndMsg(invite, maybeGameEndMsg) {
    if (!invite || !maybeGameEndMsg) {
      return null;
    }
    const players = [invite.value.author, invite.value.content.inviting];
    return winnerFromEndMsgPlayers(players, maybeGameEndMsg);
  }

  function winnerFromEndMsgPlayers(players, maybeGameEndMsg) {
    let winner;

    if (!maybeGameEndMsg || !players) {
      return null;
    }
    switch (maybeGameEndMsg.value.content.status) {
      case 'mate':
        return maybeGameEndMsg.value.author;
      case 'draw':
        return null;
      case 'resigned':
        winner = players.filter(playerId => playerId != maybeGameEndMsg.value.author)[0];
        return winner;
      default:
        return null;
    }
  }

  return {
    winnerFromEndMsg,
    winnerFromEndMsgPlayers,
  };
};
