/*
Script: Node.JS Game Server - Core Server
Author: Huy Tran
Email: kingbazoka@gmail.com
Description: 
 This project aim to create an easy to use multiplayer game server, programmers only 
 have to implement gameplay logic which will be run in each game room and don't have
 to care much about the core server.
 The Core Server is a room-based multiplayer system that enable players connect, chat
 in Global Lobby, join/create room, chat in rooms.
 Room Logic will be implemented in run() method of the file: room.js
-------------------------------------------

CORE SERVER MESSAGES:

1) Player connected to server
	RECEIVE: 	[CONNECTED;<player-name>]		(Everyone except sender)
	
2) Player disconnected from server
	RECEIVE:	[DISCONNECTED;<player-name>] 	(Everyone except sender)
	
3) Player send a chat message in Global chat
	SEND: 		[CHAT;<message>]
	RECEIVE: 	[CHAT;<player-name>;<message>]	(Everyone in Global lobby)

4) Player created a Room
	SEND:		[CREATEROOM;<room-name>;<max-players>]

5) Player joined room
	SEND:		[JOINROOM;<room-name>]
	RECEIVE:	[JOINEDROOM;<room-name>]		(Sender)
				[JOINROOM;<player-name>]		(Players already in room)
				[NOROOM;<room-name>]			(Sender - when room not found)
				[ROOMFULL;<room-name>]			(Sender - when room is full)

6) Player left room
	SEND:		[LEAVEROOM]
	RECEIVE:	[LEFTROOM;<player-name>]		(Players already in room)
	
7) Player chat in a room
	SEND:		[CHATROOM;<message>]			
	RECEIVE:	[CHATROOM;<player-name>;<message>] (Players already in room)

8) Get available room list:
	SEND:		[GETROOMLIST]
	RECEIVE:	[ROOMLIST;<list-of-room-name>]	(Sender)		
*/

var roomScript = require('./room.js');

var net = require('net');
var serverPort = 8080;

// Define Player class and player list
var playerList = [];
function Player(_x, _y, _name, _socket)
{
	this.x = _x;
	this.y = _y;
	this.name = _name;
	this.room = null;
	this.socket = _socket;

	this.joinRoom = function(roomName)
	{
		var cplayer = this;
		var roomExist = false;
		roomList.forEach(function(r){
			if (r.name == roomName)
			{
				roomExist = true;
				console.log("> ROOM EXIST! Count:" + r.playerCount + " / " + r.maxPlayer);
				if (r.playerCount < r.maxPlayer)
				{
					r.players.push(cplayer);
					r.playerCount++;
					cplayer.room = r;
					console.log("[!] " + cplayer.name + " joined room " + r.name);
					r.broadCast("[JOINROOM;" + cplayer.name + "]", cplayer);	
					cplayer.socket.write("[JOINEDROOM;" + r.name + "]");
				}
				else
				{
					cplayer.socket.write("[ROOMFULL;" + r.name + "]");
					console.log("[!] Room " + r.name + " is full");
				}
			}
		});
		if (roomExist == false)
		{
			cplayer.socket.write("[NOROOM;" + roomName + "]");	
			console.log("[!] Room " + roomName + " not found");
		}
	}

	this.leaveRoom = function()
	{
		if (this.room != null)
		{
			this.room.players.remove(this);
			this.room.playerCount--;
			this.room.broadCast("[LEFTROOM;" + this.name + "]", this);
			console.log("[!] " + this.name + " left room " + this.room.name);
			this.room = null;
		}
	}
}

// Define Room class and room list
var roomList = [];
function Room(_name, _maxPlayer)
{
	console.log("[*] Creating room with params: {" + _name + ":" + _maxPlayer + "}");
	this.name = _name;
	this.maxPlayer = _maxPlayer;
	this.playerCount = 0;
	this.players = [];
	this.roomState = 'Waiting'; // Waiting - Playing - Finished
	
	this.broadCast = function(message, _except)
	{
		this.players.forEach(function(p){
			console.log("> Check " + p.name + " : " + _except.name);
			if (p.name != _except.name)
			{
				p.socket.write(message);
			}
		});
	}
	
}

// Add remove function for arrays
Array.prototype.remove = function(e) {
  for (var i = 0; i < this.length; i++) {
    if (e == this[i]) { return this.splice(i, 1); }
  }
};

// Add trim feature
String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
String.prototype.ltrim=function(){return this.replace(/^\s+/,'');};
String.prototype.rtrim=function(){return this.replace(/\s+$/,'');};
String.prototype.fulltrim=function(){return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/,'');};

// Add startsWith and endsWidth function for strings
String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) === 0;
}
String.prototype.endsWith = function(suffix) {
    return this.match(suffix+"$") == suffix;
};

// Global Broadcast Function
function BroadcastAll(message, except)
{
	playerList.forEach(function(p){
		if (p != except)
		{
			p.socket.write(message);
		}
	});
}
function GlobalChat(message, except)
{
	if (except.room == null) // Only players in Global lobby can send message
	{
		playerList.forEach(function(p){
			if (p != except && p.room == null) // Only players in Global lobby can receive the message
			{
				p.socket.write(message);
			}
		});	
	}
}

// Main Server
net.createServer(function(socket) {
    // Create new player on connected
    var player = new Player(0, 0, "player-" + playerList.length, socket);
    // Add to PlayerList
    playerList.push(player);

    console.log("[!] " + player.name + " connected!");

    // Tell everybody the newcomer
    BroadcastAll("[CONNECTED;" + player.name + "]", player);

    // Process received data
    var receivedData = "";
    socket.on('data', function(data) {
        receivedData = data + "";
    	console.log("[i] Data received: " + player.name + " said: " + receivedData);

    	// ==================SERVER PROCESSING============================
    	// Implement chat in lobby feature
    	if (receivedData.startsWith("[CHAT;"))
    	{
    		// Broadcast
    		var chat = receivedData.substring(6, receivedData.length - 1);
    		GlobalChat("[CHAT;" + player.name + ";" + chat + "]", player);
    	}

    	// Basic Room function: Get list, create, join, leave, chat in room
    	if (receivedData.startsWith("[GETROOMLIST]"))
    	{
    		var list = "";
    		// Get room list
    		roomList.forEach(function(r){
    			list += r.name;
    		});
    		socket.write("[ROOMLIST;" + list + "]");
    	}
    	if (receivedData.startsWith("[CREATEROOM;"))
    	{
    		var roomData = receivedData.substring(12, receivedData.length - 1); // RoomName;MaxPlayer
    		var roomDataArr = roomData.split(';');
    		if (roomDataArr.length >= 2)
    		{
    			var room = new Room(roomDataArr[0], parseInt(roomDataArr[1]));
    			roomList.push(room);
    			console.log("[+] Room " + room.name + " created by " + player.name);
    			player.leaveRoom();
    			player.joinRoom(room.name);
    		}
    	}
    	if (receivedData.startsWith("[JOINROOM;"))
    	{
    		var roomName = receivedData.substring(10, receivedData.fulltrim().length - 1);
    		console.log("> SELECTED ROOM: " + roomName);
			player.joinRoom(roomName);
    	}
    	if (receivedData.startsWith("[LEAVEROOM]"))
    	{
    		player.leaveRoom();
    	}
    	if (receivedData.startsWith("[CHATROOM;"))
    	{
    		// Broadcast
    		var chat = receivedData.substring(10, receivedData.length - 1);
    		player.room.broadCast("[CHATROOM;" + player.name + ";" + chat + "]", player);
    	}
    	// ===================== EACH ROOM ================================
    	roomList.forEach(function(r){
	    	roomScript.run(r, player, receivedData);	
    	});
    	// ================================================================

    	receivedData = "";
    });

    // Handle player disconnect event
    socket.on('close', function(){
    	player.leaveRoom(); // Leave all room before disconnected
    	
    	playerList.remove(player);

    	console.log("[!] " + player.name + " disconnected!");

    	// Tell everyone Player disconnected
    	playerList.forEach(function(c){
    		// Send disconnect notify - MSG: [DC;<player name>]
    		c.socket.write("[DISCONNECTED;" + player.name + "]");
    	});
    	// Close connection
    	socket.end();
    });
    
})
.listen(serverPort);

console.log("Server is running at port " + serverPort);