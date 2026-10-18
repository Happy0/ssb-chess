const computed = require('mutant/computed');
const GameComparer = require('./gameComparer')();
const MutantArray = require('mutant/array');
const mutantPullReduce = require('mutant-pull-reduce');

/**
 * A controller for fetching games.
 * 
 * @param {*} myIdent The current user's public key
 * @param {*} ssbGameCtrl The ssb game controller which returns views of games.
 * @param {*} gameDb  The ssb game DB which tracks collections of games (my games, finished games, etc)
 * @param {*} userGamesUpdateWatcher The user game update watcher controller
 * @param {*} myGameUpdates The latest game update for the current user's games
 */
module.exports = (myIdent, ssbGameCtrl, gameDb, userGamesUpdateWatcher, myGameUpdates) => {

    function getGamesWhereMyMove() {
        const myGamesInProgress = getMyGamesInProgress();

        return computed([myGamesInProgress],
            gamesInProgress => filterGamesMyMove(gamesInProgress).sort(compareGameTimestamps),
        );
    }

    function getSituationObservable(gameId) {
        return ssbGameCtrl.getSituationObservable(gameId);
    }

    function getMyGamesInProgress() {
        return getGamesInProgress(myIdent);
    }

    function getSituation(gameId) {
        return ssbGameCtrl.getSituation(gameId);
    }

    function getSituationSummaryObservable(gameId) {
        return ssbGameCtrl.getSituationSummaryObservable(gameId);
    }

    function getFriendsObservableGames() {
        const stream = gameDb.getObservableGamesIdsStream(myIdent);

        const streamAsObservable = mutantPullReduce(stream, (state, next) => next, {
            startValue: []
        });

        return computed(streamAsObservable, (gamesInProgress) => {
            const observables = gamesInProgress.map(getSituationSummaryObservable)

            return computed(observables, function (x) {
                if (x) {
                    const all = Array.from(arguments)
                    const ready = !all.some(elem => elem == null)
                    return ready ? all.sort(compareGameTimestamps) : []
                } else {
                    return []
                }
            })
        })
    }

    function getGamesInProgress(playerId) {
        const stream = gameDb.getGamesInProgressIdsStream(playerId)

        const streamAsObservable = mutantPullReduce(stream, (state, next) => next, {
            startValue: []
        });

        return computed(streamAsObservable, (gamesInProgress) => {
            const observables = gamesInProgress.map(getSituationSummaryObservable)

            return computed(observables, function (x) {
                if (x) {
                    const all = Array.from(arguments)
                    const ready = !all.some(elem => elem == null)
                    return ready ? all.sort(compareGameTimestamps) : []
                } else {
                    return []
                }
            })
        })
    }

    function updateObservableWithGameChange(summaryListPromiseFn, newUpdate, observable) {
        const type = newUpdate.value ? newUpdate.value.content.type : null;
        if (type === 'chess_move') {
            ssbGameCtrl.getSmallGameSummary(newUpdate.value.content.root).then(
                (summary) => {
                    const { gameId } = summary;
                    const idx = observable().findIndex(s => s.gameId === gameId);

                    if (idx !== -1) {
                        observable.put(idx, summary);
                    } else {
                        summaryListPromiseFn().then(g => observable.set(g.sort(compareGameTimestamps)));
                    }
                },
            );
        } else {
            summaryListPromiseFn().then(g => observable.set(g.sort(compareGameTimestamps)));
        }
    }

    function filterGamesMyMove(gameSummaries) {
        return gameSummaries.filter(summary => summary.toMove === myIdent);
    }

    function compareGameTimestamps(g1, g2) {
        return g2.lastUpdateTime - g1.lastUpdateTime;
    }

    function getAllGamesInDbIds() {
        return gameDb.getAllGameIds();
    }

    return {
        getGamesWhereMyMove,
        getMyGamesInProgress,
        getGamesInProgress,
        getFriendsObservableGames,
        getSituation,
        getSituationObservable,
        getSituationSummaryObservable,
        getAllGamesInDbIds
    }
}