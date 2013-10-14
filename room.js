/*
Script: Node.JS Game Server - Room Logic
Author: Huy Tran
Email: kingbazoka@gmail.com
*/

function run(room, player, msg)
{
	// Implement your game room (server side) logic here
	console.log("Processing " + player.name + "@" + room.name + ": " + msg);
}

module.exports.run = run;