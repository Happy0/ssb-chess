const computed = require('mutant/computed');
const mutantPullReduce = require('mutant-pull-reduce');
const Aborter = require('pull-abortable');
const pull = require('pull-stream')

/**
 * A controller for fetching games.
 * 
 * @param {*} myIdent The current user's public key
 * @param {*} ssbGameCtrl The ssb game controller which returns views of games.
 * @param {*} gameDb  The ssb game DB which tracks collections of games (my games, finished games, etc)
 */
module.exports = (myIdent, ssbGameCtrl, gameDb) => {

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

        const aborter = Aborter();
        const abortableStream = pull(stream, aborter)


        const streamAsObservable = mutantPullReduce(abortableStream, (state, next) => next, {
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
        },{
            onUnlisten: () => {
                // Called when there are 0 listeners. TODO: make it possible to 'cold restart' an existing observable
                // that has went to 0 and has got a listener again
                aborter.abort()
            }
        })
    }

    function getGamesInProgress(playerId) {
        const stream = gameDb.getGamesInProgressIdsStream(playerId)
        const aborter = Aborter();

        const abortableStream = pull(stream, aborter)

        const streamAsObservable = mutantPullReduce(abortableStream, (state, next) => next, {
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
        }, {
            onUnlisten: () => {
                // Called when there are 0 listeners. TODO: make it possible to 'cold restart' an existing observable
                // that has went to 0 and has got a listener again
                aborter.abort()
            }
        })
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