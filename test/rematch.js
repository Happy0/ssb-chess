const describe = require('mocha').describe;
const assert = require('assert');
const GameCtrl = require('../ssb_ctrl/game');
const Value = require('mutant/value');
const fs = require('fs');

const watch = require('mutant/watch');

describe('Rematch', function() {

    const gameId = "%/YqXidBKnATnSkKOZSliEllkRqrdo0csbeF/xt6lR1k=.sha256";

    const rematchId = "%7Ko0nl87fHFxx3WmWLb2eNwGteSwdqUPYa5ybjtjR5I=.sha256";

    // I'll look at what mocking frameworks are available on javascript later ;x

    var sbotMock = {

        get: (id, cb) => {

            if (id === gameId) {
                var inviteMessage = {
                    "previous": "%ZtkVfWMVG7RbLSJ8p6FtNBw/lMlcnC9nNlqTnPeRjNk=.sha256",
                    "sequence": 15456,
                    "author": "@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519",
                    "timestamp": 1550602607768,
                    "hash": "sha256",
                    "content": {
                      "type": "chess_invite",
                      "inviting": "@HEqy940T6uB+T+d9Jaa58aNfRzLx9eRWqkZljBmnkmk=.ed25519",
                      "myColor": "black",
                      "branch": [
                        "%eu3NXmX+3W5oIoQRVidittVlDuFfNd3O7lUn/+Duwtk=.sha256",
                        "%1F8Wm55Hvw070OARbmy3rgODqaOFI+izMCQuwuhz0ro=.sha256",
                        "%X/aaewdjTeRjzw7OMpKmcng5/eLlbU25p/uUjUOYCSs=.sha256",
                        "%seGaypHi2RH3YY0zwLnbOU3+CfFesp0Y290iwGz46MU=.sha256",
                        "%9oK3ltfnvH9/7h5sxD6Cu+IYoSXcOddTMPJ5L6dLsUM=.sha256",
                        "%Adu40jiwOvGUXyZqefzsm8Qxd7TGOObH4NuiQNjqC2I=.sha256"
                      ]
                    },
                    "signature": "jNhizxfIy70uflwEFvjjliSNi/6RH5UXpNXwWfi6sfBAjO5AKVteN+Tfybvn9TmKNXsiA8HKiuWHA94TjXIpBw==.sig.ed25519"
                };

                cb(null, inviteMessage);
            } else if (id === rematchId) {

                var rematchInvite = {
                    "previous": "%ZtkVfWMVG7RbLSJ8p6FtNBw/lMlcnC9nNlqTnPeRjNk=.sha256",
                    "sequence": 15456,
                    "author": "@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519",
                    "timestamp": 1550602607768,
                    "hash": "sha256",
                    "content": {
                      "type": "chess_invite",
                      "root": gameId,
                      "inviting": "@HEqy940T6uB+T+d9Jaa58aNfRzLx9eRWqkZljBmnkmk=.ed25519",
                      "myColor": "black",
                      "branch": [
                        "%eu3NXmX+3W5oIoQRVidittVlDuFfNd3O7lUn/+Duwtk=.sha256",
                        "%1F8Wm55Hvw070OARbmy3rgODqaOFI+izMCQuwuhz0ro=.sha256",
                        "%X/aaewdjTeRjzw7OMpKmcng5/eLlbU25p/uUjUOYCSs=.sha256",
                        "%seGaypHi2RH3YY0zwLnbOU3+CfFesp0Y290iwGz46MU=.sha256",
                        "%9oK3ltfnvH9/7h5sxD6Cu+IYoSXcOddTMPJ5L6dLsUM=.sha256",
                        "%Adu40jiwOvGUXyZqefzsm8Qxd7TGOObH4NuiQNjqC2I=.sha256"
                      ]
                    },
                    "signature": "jNhizxfIy70uflwEFvjjliSNi/6RH5UXpNXwWfi6sfBAjO5AKVteN+Tfybvn9TmKNXsiA8HKiuWHA94TjXIpBw==.sig.ed25519"
                  }

                  cb(null, rematchInvite);
            }
            else {
                throw new Error("Unexpected input to sbot get 'mock' " + id);
            }

        }
    
    };

    var backlinkUtilsMock = function(isAccepted) {
        return {
            getFilteredBackLinks: (id, opts) => {
                if (id === gameId) {
    
                    var contents = fs.readFileSync(__dirname + '/resources/rematch_offered_backlinks.json');
                    var backlinks = JSON.parse(contents);
    
                    var result = Value();
                    result.set(backlinks);

                    result.sync = Value();
                    result.sync.set(true);

                    return result;
                } else if (id === rematchId) {
    
                    var file = isAccepted ? "/resources/rematch_offer_accepted.json" : "/resources/rematch_offered.json";
                    var contents = fs.readFileSync(__dirname + file);
                    var backlinks = JSON.parse(contents);
                    
                    var result = Value(backlinks);
                    result.sync = Value();
                    result.sync.set(true);

                    return result;
                } else {
                    throw new Error("Unepexted input to getFilteredBacklinks 'mock' " + id);
                }
            }
        }
    };

    var socialCtrlMock = {

        getDisplayName: (id) => {

            if (id === "@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519") {
                return Promise.resolve("Rodge");
            } else if (id === "@HEqy940T6uB+T+d9Jaa58aNfRzLx9eRWqkZljBmnkmk=.ed25519") {
                return Promise.resolve("Hecky");
            } else {
                throw new Error("getDisplayName mock unexpected input: " + id);
            }

        }

    };

    const myIdent = "@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519";

    describe('#offered', function() {

        it("Should detect an offered rematch from current user", function(done) {
            const gameCtrl = GameCtrl(sbotMock, myIdent, backlinkUtilsMock(false), socialCtrlMock);
            var situation = gameCtrl.getSituationObservable(gameId);

            watch(situation, state => {

                if (!state || (state.rematches.length > 0 && state.rematches[0].status === "pending" )) return;

                assert.equal(1, state.rematches.length);
                assert.equal(rematchId, state.rematches[0].gameId);
                assert.equal("invited", state.rematches[0].status);
                assert.equal(true, state.rematches[0].isMyInvite);

                done();
                
            });

        });

    });

    describe('#accepted', function() {
        it("Should detect an offered rematch has been accepted", function(done) {
            const gameCtrl = GameCtrl(sbotMock, myIdent, backlinkUtilsMock(true), socialCtrlMock);
            var situation = gameCtrl.getSituationObservable(gameId);

            watch(situation, state => {

                if (!state || (state.rematches.length > 0 && state.rematches[0].status === "pending" )) return;

                assert.equal(1, state.rematches.length);
                assert.equal(rematchId, state.rematches[0].gameId);
                assert.equal("accepted", state.rematches[0].status);
                assert.equal(true, state.rematches[0].isMyInvite);

                done();
                
            });
        });
    })
});