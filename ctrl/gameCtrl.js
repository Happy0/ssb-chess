const computed = require('mutant/computed');
const GameComparer = require('./gameComparer')();
const MutantArray = require('mutant/array');

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
            gamesInProgress => computed(
                [gamesInProgress],
                games => filterGamesMyMove(games).sort(compareGameTimestamps),
            ));
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

    function getFriendsObservableGames(startArg, endArg) {
        const observable = MutantArray([]);

        const start = startArg || 0;
        const end = endArg || 20;

        gameDb.getObservableGames(myIdent, start, end).then(
            gameIds => Promise.all(
                gameIds.map(ssbGameCtrl.getSmallGameSummary),
            ),
        ).then(a => a.sort(compareGameTimestamps)).then(observable.set);

        const observingUpdates = userGamesUpdateWatcher.latestGameMessageForOtherPlayersObs(myIdent);

        const unlistenObservingUpdates = observingUpdates(
            newUpdate => updateObservableWithGameChange(
                () => gameDb.getObservableGames(myIdent, start, end).then(
                    gameIds => Promise.all(
                        gameIds.map(ssbGameCtrl.getSmallGameSummary),
                    ),
                ),
                newUpdate,
                observable,
            ),
        );

        return computed(
            [observable],
            a => a.sort(compareGameTimestamps), {
                comparer: GameComparer.hasSameGames,
                onUnlisten: unlistenObservingUpdates,
            },
        );
    }

    function gamesAgreedToPlaySummaries(playerId) {
        return gameDb.getGamesAgreedToPlayIds(playerId).then(gamesInProgress => Promise.all(
            gamesInProgress.map(ssbGameCtrl.getSmallGameSummary),
        ));
    }

    function getGamesInProgress(playerId) {
        const observable = MutantArray([]);
        gamesAgreedToPlaySummaries(playerId).then(g => observable.set(g.sort(compareGameTimestamps)));

        const playerGameUpdates = getGameUpdatesObservable(playerId);

        const unlistenUpdates = playerGameUpdates(
            newUpdate => updateObservableWithGameChange(
                () => gamesAgreedToPlaySummaries(playerId),
                newUpdate,
                observable,
            ),
        );

        return computed(
            [observable],
            a => a, {
                onUnlisten: unlistenUpdates,
            },
        );
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

    function getGameUpdatesObservable(ident) {
        if (ident === myIdent) {
            return myGameUpdates;
        }
        return userGamesUpdateWatcher.latestGameMessageForPlayerObs(ident);
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