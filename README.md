Node.JS Game Server
===================

This project aim to create an easy to use multiplayer game server. Suitable with HTML5 Websocket, Unity3D, Flash, C++/OpenGL/DirectX, XNA clients,...
Programmers onlyhave to implement gameplay logic which will be run in each game room and don't have to care much about the core server.
The Core Server is a room-based multiplayer system that enable players connect, chat in Global Lobby, join/create room, chat in rooms.

## Writing Game Logic

Room Logic will be implemented in **run()** method of the file: **room.js** like this:
```javascript
function run(room, player, msg)
{
	// Implement your game room (server side) logic here
	console.log("Processing " + player.name + "@" + room.name + ": " + msg);
}
```
With **room**: is the current game room. **player**: is the current player who sending message. **msg**: is the message sent from player.

## Core Server Messages

The list below is the messages defined and used by Core Server. You need this to implement some feature (join room, create room, chat,...) in client-side

1) Player connected to server
	RECEIVE: 	
	```[CONNECTED;<player-name>]```		(Everyone except sender)
	
2) Player disconnected from server
	RECEIVE:	
	```[DISCONNECTED;<player-name>]``` 	(Everyone except sender)
	
3) Player send a chat message in Global chat
	SEND: 		
	```[CHAT;<message>]```
	RECEIVE: 	
	```[CHAT;<player-name>;<message>]```	(Everyone in Global lobby)

4) Player created a Room
	SEND:		
	```[CREATEROOM;<room-name>;<max-players>]```

5) Player joined room
	SEND:		
	```[JOINROOM;<room-name>]```
	RECEIVE:	
	```[JOINEDROOM;<room-name>]```		(Sender)
	```[JOINROOM;<player-name>]```		(Players already in room)
	```[NOROOM;<room-name>]```			(Sender - when room not found)
	```[ROOMFULL;<room-name>]```			(Sender - when room is full)

6) Player left room
	SEND:		
	```[LEAVEROOM]```
	RECEIVE:	
	```[LEFTROOM;<player-name>]```		(Players already in room)
	
7) Player chat in a room
	SEND:		
	```[CHATROOM;<message>]```
	RECEIVE:	
	```[CHATROOM;<player-name>;<message>]``` (Players already in room)

8) Get available room list:
	SEND:		
	```[GETROOMLIST]```
	RECEIVE:	
	```[ROOMLIST;<list-of-room-name>]```	(Sender)	

