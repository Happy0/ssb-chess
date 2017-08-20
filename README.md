# ssb-chess

![A screenshot of ssb-chess](http://i.imgur.com/Xz9ovwX.png)

Correspondence chess built on top of the scuttlebutt platform. More information about scuttlebutt here: https://staltz.com/an-off-grid-social-network.html and [https://www.scuttlebutt.nz/](https://www.scuttlebutt.nz/)

It is built to allow it to be integrated into scuttlebutt viewers (such as [patchbay](https://www.github.com/ssbc/patchbay) and [patchwork](https://www.github.com/ssbc/patchbay) using [depject](https://github.com/depject/depject) so that they can take care of things like discovering friends to play with, etc.

### Installation
ssb-chess is currently integrated into [patchbay](https://www.github.com/ssbc/patchbay). You can find it in the menu at the top right (the blue dot) and then the 'chess' menu item.

### Libraries used
* [Mithriljs](https://mithril.js.org/) is used for rendering the pages.
* [Chessground](https://github.com/ornicar/chessground) is used for the board and pieces widget and animating the moves.
* [Scalachessjs](https://github.com/veloce/scalachessjs) is used for move validation and check / end condition detection.
* [ssb Embedded Chat](https://github.com/happy0/ssb-embedded-chat) is used for the chatroom to allow the players to chat during their game.

# Protocol

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

### Integrating ssb-chess into a scuttlebutt application using depject
<TODO>
