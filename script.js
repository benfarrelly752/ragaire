var currentRoom = "start";
var currentConversation = "scobes";
var commands = ["go", "pickup", "inventory", "talk", "examine", "pickup", "use"];
var inventory = ["baccy", "snickers"];

function pickup(item) {
    if (rooms[currentRoom].pickup[item] !== undefined) {
        currentConversation = rooms[currentRoom].pickup[item]
        $('#game-text').append("<p>" + rooms[currentRoom].pickup[item] + "</p>");
        inventory.push(item); 
    } else {
        $('#game-text').append("<p>Don't be lookin at that ya bastard!!</p>");
    }
}

function use(item) {
    const found = false;
    for (var i = 0; i < inventory.length; i++) {
    if (inventory[i] == item ) {
        found = true;
        $('#game-text').append("<p>You used the glock</p>");
        if(rooms[currentRoom].use[item] !== undefined){
        currentConversation = rooms[currentRoom].use[item]
        $('#game-text').append("<p>" + rooms[currentRoom].use[item] + "</p>");
        }
    }
}
    if(found == false){
        $('#game-text').append("<p>You don't have this item you spud</p>");

    }

}
     

function showExamine(item) {
    if (rooms[currentRoom].examine[item] !== undefined) {
        currentConversation = rooms[currentRoom].examine[item]
        $('#game-text').append("<p>" + rooms[currentRoom].examine[item] + "</p>");
    } else {
        $('#game-text').append("<p>Don't be examining that ya bastard!!</p>");
    }


}

function talkto(npc) {
    if (rooms[currentRoom].speak[npc] !== undefined) {
        currentConversation = rooms[currentRoom].speak[npc]
        $('#game-text').append("<p>" + rooms[currentRoom].speak[npc] + "</p>");
    } else {
        $('#game-text').append("<p>You cannot talk to them!!</p>");
    }


}

function changeRoom(dir) {
    if (rooms[currentRoom].directions[dir] !== undefined) {
        currentRoom = rooms[currentRoom].directions[dir]
        $('#game-text').append("<p>" + rooms[currentRoom].description + "</p>");
    } else {
        $('#game-text').append("<p>You cannot do that</p>");
    }


}


function showHelp() {
    $('#game-text').append("<p>Here are the possible commands: </p>");
    $('#game-text').append("<p><ul>");
    for (var i = 0; i < commands.length; i++) {
        $('#game-text').append("<li>" + commands[i] + "</li>");
    }
    $('#game-text').append("</ul></p>");

}

function showInventory() {
    if (inventory.length === 0) {
        $('#game-text').append("<p>You are not carrying anything!</p>");
        return;
    }
    $('#game-text').append("<p>Here is your inventory: </p>");
    $('#game-text').append("<p><ul>");
    for (var i = 0; i < inventory.length; i++) {
        $('#game-text').append("<li>" + inventory[i] + "</li>");
    }
    $('#game-text').append("</ul></p>");

}

function playerInput(input) {
    var command = input.split(" ")[0];
    switch (command) {
        case "go":
            var dir = input.split(" ")[1];
            changeRoom(dir);
            break;
        case "talk":
            var npc = input.split(" ")[1];
            talkto(npc);
            break;
        case "help":
            showHelp();
            break;
            case "examine":
             var item = input.split(" ")[1];
            showExamine(item);
            break;
             case "pickup":
             var item = input.split(" ")[1];
            pickup(item);
            break;
             case "use":
             var item = input.split(" ")[1];
            use(item);
            break;
        case "inventory":
            showInventory();
            break;
        default:
            $('#game-text').append("<p>Invalid command!</p>");
    }
}
 
$(document).ready(function() {
    $('#game-text').append("<p>" + rooms.start.description + "</p>");
    $(document).keypress(function(key) {
        if (key.which === 13 && $('#user-input').is(':focus')) {
            var value = $('#user-input').val().toLowerCase();
            $('#user-input').val("");
            playerInput(value);
        }
    })


})