# ssb-chess

![A screenshot of ssb-chess](http://i.imgur.com/Xz9ovwX.png)

Correspondence chess built on top of the scuttlebutt platform. More information about scuttlebutt here: https://staltz.com/an-off-grid-social-network.html and [https://www.scuttlebutt.nz/](https://www.scuttlebutt.nz/)

It is built to allow it to be integrated into scuttlebutt viewers (such as [patchbay](https://www.github.com/ssbc/patchbay), [patchwork](https://www.github.com/ssbc/patchbay) using [depject](https://github.com/depject/depject) so that they can take care of things like discovering friends to play with, etc.

### Installation
ssb-chess is currently integrated into [patchbay](https://www.github.com/ssbc/patchbay). You can find it in the menu at the top right (the blue dot) and then the 'chess' menu item.

### Libraries used
* [Mithriljs](https://mithril.js.org/) is used for rendering the pages.
* [Chessground](https://github.com/ornicar/chessground) is used for the board and pieces widget and animating the moves.
* [Scalachessjs](https://github.com/veloce/scalachessjs) is used for move validation and check / end condition detection.
* [Embedded Chat](https://github.com/happy0/ssb-embedded-chat) is used for the chatroom to allow the players to chat during their game.

# Protocol

*Note*: since this is built on a peer 2 peer protocol, messages may be corrupted or deliberately misleading to cheat. ssb-chess doesn't validate that the client agrees a post is valid yet as it assumes your friends can be trusted.

The documentation below documents the 'content' section of the [scuttlebutt messages](https://ssbc.github.io/secure-scuttlebutt/). The 'author' field is the ID of person who posted the message (made the chess move, posted the chat message, etc.)

## Send an Invitation to Play
Type `chess_invite`

### Fields
* Inviting - the ID of the player being invited.
* myColor - the colour of the inviting player (white or black.)

```javascript
{
  "type": "chess_invite",
  "inviting": "@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519",
  "myColor": "black"
}
```
The key of the message inviting a player to play then becomes the game ID which subsequent messages link back to.

## Accept an Invitation to Accept
Type `chess_invite_accept`

### Fields
* root - the key of the invitiation message that is being accepted.

```javascript
{
      "type": "chess_invite_accept",
      "root": "%JJis5OErved3kJu2q9tpPyd+hjFq4EnqHUusy6LJ+OE=.sha256"
    }
```
A player may accept an invite they have received by sending a message of type ```chess_invite_accept``` linking back to the key of the original game invitation message.

The game is then 'in progress.'

## A chess move
Type `chess_move`

### Fields
* root - the original game invite message key.
* ply - the move number
* orig - the origin square
* dest - the destination square
* pgnMove - the [PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation) of the move.
* fen - the position of the board after the move in [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) notation.
* promotion (optional) - A letter donating the piece a pawn should be promoted to (b,n,q,r denoting bishop, knight, queen and rook respectively.)

```javascript
{
  "type": "chess_move",
  "ply": 26,
  "root": "%WbzP0UxevK8j4g6CdLmgFnsjblnW0EVp/u6phVD5Y/4=.sha256",
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
* status - the status the game ended with. May be one of the following: `mate | draw | resigned`.
* ply (optional - may be omitted for resignations) - the move number
* orig (optional - may be omitted for resignations) - the origin square
* dest (optional - may be omitted for resignations) - the destination square
* pgnMove (optional - may be omitted for resignations) - the [PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation) of the move.
* fen (optional - may be omitted for resignations) - the position of the board after the move in [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) notation.
* promotion (optional) - A letter donating the piece a pawn should be promoted to (b,n,q,r denoting bishop, knight, queen and rook respectively.)

*Note*: The client should work out the winner for display based on who posted the message. For resign messages, the opposite player is the winner. For 'mate' messages, the player authoring the message is the winner and for a draw there are no winners.

```javascript
{
 "type": "ssb_chess_game_end",
  "status": "mate",
  "ply": 20,
  "fen": "rnb2rk1/ppp2ppp/3p4/4p1qK/2P1n3/8/P2P1PPP/RNB2BNR w - - 2 11",
  "root": "%HGPn7yS2bjpWZndXtuusOjGXrirIIGu0XS18aY8YoFM=.sha256",
  "winner": "@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519",
  "orig": "f6",
  "dest": "g5",
  "pgnMove": "Qg5#"
}
```

## Chess Chat
Type `ssb_chess_chat`

*Note*: the content of the message is encrypted using [`sbot.private.publish`](https://ssbc.github.io/docs/scuttlebot/howto-publish-encrypted-messages.html) with an array of the IDs of the players of the game as the `recipients` parameter.

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

## Required scuttlebot plugins

* Requires the ssb-chess-db which is used to index the state of all the known games.

## Integrating ssb-chess into a scuttlebutt application using depject

You can read more about depject [here](https://github.com/depject/depject)

<TODO> The strategy for this was recently updated. I need to document the
new approach :)
