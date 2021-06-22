# ssb-chess

A library for building chess clients for the scuttlebutt platform. This library is intended to make it easier to build your own ssb-chess client, bot or tool.

For an example of a scuttlebutt chess client built using this library see [ssb-chess-mithril](https://www.github.com/happy0/ssb-chess-mithril).


# Protocol

*Note*: since this is built on a peer 2 peer protocol, messages may be corrupted or deliberately misleading to cheat. ssb-chess doesn't validate that the client agrees a post is valid yet as it assumes your friends can be trusted.

The documentation below documents the 'content' section of the [scuttlebutt messages](https://ssbc.github.io/secure-scuttlebutt/). The 'author' field of the outer object containing the `content` field is the ID of person who posted the message (made the chess move, posted the chat message, invited another player to a game, etc.)

For example, the entire scuttlebutt message for a move could look like this:

```
{
  "key": "%mbTncS4L6NkmWbUu28SYFR+gkS+EBXtv69qw1Nys+GA=.sha256",
  "value": {
    "previous": "%tAgOzYHfdUDjTCtL/WPdBFikGpi7FF1y5yluIa0L70c=.sha256",
    "author": "@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519",
    "sequence": 2467,
    "timestamp": 1512721788946,
    "hash": "sha256",
    "content": {
      "type": "chess_move",
      "ply": 35,
      "root": "%GplJjfQtF931QBN/QLb5Dbkkn7p6vPDa6GlArwx7lXs=.sha256",
      "orig": "d6",
      "dest": "e7",
      "pgnMove": "dxe7",
      "fen": "r1b2rk1/pp1pPppp/6q1/8/2Pp1B2/1Q1P2P1/PP4BP/R3R1K1 b - - 0 18",
      "branch": "%FvjrSmC/02bneFhr1/xZz9K5HQezQBTI4nEyG3rQ7FM=.sha256"
    },
    "signature": "0SpisCR/celfcZsc9Bc0Ikq/12bAp2B3sNh5q0lPqTB1JsMT56rtVzxq75ly1eE3+bp+vj+XfZ262wDCNLjhDw==.sig.ed25519"
  },
  "timestamp": 1513461650805.013
}
```

## Send an Invitation to Play
Type `chess_invite`

### Fields
* Inviting - the ID of the player being invited.
* myColor - the colour of the inviting player (white or black.)
* root [optional] - the ID of the game this is a rematch offer from, if this is a rematch invite.
* branch [optional] - As a convenience to clients, a client can optionally provide a list of the latest name / picture / description messages for the 2 players. This is so that ssb-ooo can pull these messages if one of the players is outside one of the other's follow graph. The ssb-ooo-about module provided convenience functions for grabbing these. This may also contain the ID of the game that this was a rematch from.

```javascript
{
  "type": "chess_invite",
  "inviting": "@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519",
  "myColor": "black",
  "branch": [
        "%g3D2FJH3LeGoZ/2jmNgydP2bZqISBZq3lfgJGBlBCrg=.sha256",
        "%59xEb4ZqY1P3eksel9aUE6su/xZ5K/zHjOtUb1NG8HE=.sha256",
        "%6L/zMxXPcoCui1Z0wbVye2ES+13o5KG2zHiMhPFbHIY=.sha256",
        "%seGaypHi2RH3YY0zwLnbOU3+CfFesp0Y290iwGz46MU=.sha256",
        "%9oK3ltfnvH9/7h5sxD6Cu+IYoSXcOddTMPJ5L6dLsUM=.sha256",
        "%Adu40jiwOvGUXyZqefzsm8Qxd7TGOObH4NuiQNjqC2I=.sha256"
  ]
}
```
The key of the message inviting a player to play then becomes the game ID which subsequent messages link back to.

## Accept an Invitation to Accept
Type `chess_invite_accept`

### Fields
* root - the key of the invitation message that is being accepted.
* branch - the key of the invitation message that is being accepted. This is used to support ssb-ooo, which allows clients to
           request messages that are not visible in their follow graph. This helps clients observe the game, even if the user isn't close to one of the players in the follow graph.

```javascript
{
      "type": "chess_invite_accept",
      "root": "%JJis5OErved3kJu2q9tpPyd+hjFq4EnqHUusy6LJ+OE=.sha256",
      "branch": "%JJis5OErved3kJu2q9tpPyd+hjFq4EnqHUusy6LJ+OE=.sha256"
    }
```
A player may accept an invite they have received by sending a message of type ```chess_invite_accept``` linking back to the key of the original game invitation message.

The game is then 'in progress.'

## A chess move
Type `chess_move`

### Fields
* root - the original game invite message key.
* branch - the key of the previous move that the move is being made in response to. This is used to support ssb-ooo, which allows clients to
           request messages that are not visible in their follow graph. This helps clients observe the game, even if the user isn't close to one of the players in the follow graph.
* ply - the move number
* orig - the origin square
* dest - the destination square
* pgnMove - the [PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation) of the move.
* fen - the position of the board after the move in [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) notation.
* promotion (optional) - A letter denoting the piece a pawn should be promoted to (b,n,q,r denoting bishop, knight, queen and rook respectively.)

```javascript
{
  "type": "chess_move",
  "ply": 26,
  "root": "%WbzP0UxevK8j4g6CdLmgFnsjblnW0EVp/u6phVD5Y/4=.sha256",
  "branch": "%FvjrSmC/02bneFhr1/xZz9K5HQezQBTI4nEyG3rQ7FM=.sha256",
  "orig": "b2",
  "dest": "c1",
  "pgnMove": "bxc1=B",
  "fen": "r2qkbnr/p3pppp/3p4/6B1/4P3/5Q2/b2N1PPP/2b1KB1R w kq - 0 14",
  "promotion": "b"
}
```
## Game end
Type `chess_game_end`

### Fields
* root - the original game invite message key.
* branch - the key of the previous move that the end of the game is in response to. This is used to support ssb-ooo, which allows clients to
           request messages that are not visible in their follow graph. This helps clients observe the game, even if the user isn't close to one of the players in the follow graph.
* status - the status the game ended with. May be one of the following: `mate | draw | resigned`.
* ply (optional - may be omitted for resignations) - the move number
* orig (optional - may be omitted for resignations) - the origin square
* dest (optional - may be omitted for resignations) - the destination square
* pgnMove (optional - may be omitted for resignations) - the [PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation) of the move.
* fen (optional - may be omitted for resignations) - the position of the board after the move in [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) notation.
* promotion (optional) - A letter denoting the piece a pawn should be promoted to (b,n,q,r denoting bishop, knight, queen and rook respectively.)

*Note*: The client should work out the winner for display based on who posted the message. For resign messages, the opposite player is the winner. For 'mate' messages, the player authoring the message is the winner and for a draw there are no winners.

```javascript
{
 "type": "chess_game_end",
  "status": "mate",
  "ply": 20,
  "fen": "rnb2rk1/ppp2ppp/3p4/4p1qK/2P1n3/8/P2P1PPP/RNB2BNR w - - 2 11",
  "root": "%HGPn7yS2bjpWZndXtuusOjGXrirIIGu0XS18aY8YoFM=.sha256",
  "branch": "%FvjrSmC/02bneFhr1/xZz9K5HQezQBTI4nEyG3rQ7FM=.sha256",
  "orig": "f6",
  "dest": "g5",
  "pgnMove": "Qg5#"
}
```

## Chess Chat
Type `chess_chat`

*Note*: If this is a private message between the two players in the game, the content of the message is encrypted using [`sbot.private.publish`](https://ssbc.github.io/docs/scuttlebot/howto-publish-encrypted-messages.html) with an array of the IDs of the players of the game as the `recipients` parameter.

If it is not a private message, it is a public message in the observer chat between spectators of the game. This shouldn't be displayed to the two players playing (or only displayed after the game has finished) so that the game isn't interfered with. Obviously a player could look at the raw feed to see what other people are saying about the game, but it's better to not make the chat easily visible.

### Fields
* root - the original game invite message key.
* msg - The chat message contents.

```javascript
{
  msg: "Chat testarooni"
  root: "%YQktCnxwY0rQyljO6BLrD7AQwRpf13HzbsVAZV19vlo=.sha256"
  type: "chess_chat"
}
```
# Chess logic library

* [Scalachessjs](https://github.com/veloce/scalachessjs) is used for move validation and check / end condition detection.

