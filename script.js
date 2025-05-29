// Refactored Global State
const gameState = {
    currentRoom: "start",
    currentConversation: "scobes",
    commands: ["go", "pickup", "inventory", "talk", "examine", "use"],
    inventory: ["baccy", "snickers"]
};

// Helper function to append text to game-text
const appendToGameText = (text) => {
    $('#game-text').append(`<p>${text}</p>`);
};

const updateBackground = (room) => {
    const description = `Image of ${room} in an immersive text adventure game.`;
    fetch(`/generate-image?description=${encodeURIComponent(description)}`)
    .then(response => response.json())
    .then(data => {
        $('body').css('background-image', `url(${data.imageUrl})`);
    })
    .catch(error => console.error('Error fetching image:', error));
};

// Command functions leveraging new gameState and helper function
function pickup(item) {
    if (rooms[gameState.currentRoom].pickup && rooms[gameState.currentRoom].pickup[item] !== undefined) {
        gameState.currentConversation = rooms[gameState.currentRoom].pickup[item];
        appendToGameText(rooms[gameState.currentRoom].pickup[item]);
        gameState.inventory.push(item);
    } else {
        appendToGameText("Don't be lookin at that ya bastard!!");
    }
}

function use(item) {
    const found = gameState.inventory.includes(item); // Simplified with Array.includes
    if (found) {
        appendToGameText(`You used the ${item}`);
        if (rooms[gameState.currentRoom].use && rooms[gameState.currentRoom].use[item] !== undefined) {
            gameState.currentConversation = rooms[gameState.currentRoom].use[item];
            appendToGameText(rooms[gameState.currentRoom].use[item]);
        }
    } else {
        appendToGameText("You don't have this item you spud");
    }
}

function showExamine(item) {
    if (rooms[gameState.currentRoom].examine && rooms[gameState.currentRoom].examine[item] !== undefined) {
        gameState.currentConversation = rooms[gameState.currentRoom].examine[item];
        appendToGameText(rooms[gameState.currentRoom].examine[item]);
    } else {
        appendToGameText("Don't be examining that ya bastard!!");
    }
}

function talkto(npc) {
    if (rooms[gameState.currentRoom].speak && rooms[gameState.currentRoom].speak[npc] !== undefined) {
        gameState.currentConversation = rooms[gameState.currentRoom].speak[npc];
        appendToGameText(rooms[gameState.currentRoom].speak[npc]);
    } else {
        appendToGameText("You cannot talk to them!!");
    }
}

function changeRoom(dir) {
    if (rooms[gameState.currentRoom].directions && rooms[gameState.currentRoom].directions[dir] !== undefined) {
        gameState.currentRoom = rooms[gameState.currentRoom].directions[dir];
        appendToGameText(rooms[gameState.currentRoom].description);
        updateBackground(gameState.currentRoom); // Update background on room change
    } else {
        appendToGameText("You cannot go that way.");
    }
}

function showHelp() {
    appendToGameText("Here are the possible commands: ");
    gameState.commands.forEach(command => appendToGameText(`<li>${command}</li>`));
}

function showInventory() {
    if (gameState.inventory.length === 0) {
        appendToGameText("You are not carrying anything!");
        return;
    }
    appendToGameText("Here is your inventory:");
    gameState.inventory.forEach(item => appendToGameText(`<li>${item}</li>`));
}

function playerInput(input) {
    const command = input.split(" ")[0];
    const arg = input.split(" ")[1];
    switch (command) {
        case "go":
            changeRoom(arg);
            break;
        case "talk":
            talkto(arg);
            break;
        case "help":
            showHelp();
            break;
        case "examine":
            showExamine(arg);
            break;
        case "pickup":
            pickup(arg);
            break;
        case "use":
            use(arg);
            break;
        case "inventory":
            showInventory();
            break;
        default:
            appendToGameText("Invalid command!");
    }
}

$(document).ready(function() {
    // Initial message about how to use commands
    appendToGameText("Use commands like 'go', 'pickup', 'talk', 'examine', 'use', and 'inventory' to interact with the world.");
    appendToGameText(rooms.start.description);
    updateBackground('start'); // Initialize background on game start

    $(document).keypress(function(key) {
        if (key.which === 13 && $('#user-input').is(':focus')) {
            const value = $('#user-input').val().toLowerCase();
            $('#user-input').val("");
            playerInput(value);
        }
    });
});
