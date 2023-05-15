function joinPlayers(idClient, players) {
    for (const player in players) {
        const currentPlayer = players[player];
        if (currentPlayer == '') {
            players[player] = idClient;
            return;
        }
    }
}

function getKeyByValue(obj, value) {
    return Object.keys(obj).find(key => obj[key] === value);
}

export{
    joinPlayers,
    getKeyByValue
}