import path from 'path';
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { Field } from './components/field.js';
import { sequelize } from './db.js'
import { Message } from './models/model.js';
import MessageController from './controllers/messageController.js';
import{
    joinPlayers,
    getKeyByValue
} from './utils/functions.js';

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

const field = new Field();
const players = {
    1: '',
    2: ''
}


let activePlayer = 1;  //1-крестик; 2-нолик
let started = false; // если true то игра началась и есть возможность перезагружать страницу, без потери контента
let gameOver = false; //проверка на конец игры
let timerGame; // чтобы таймер работал. 

app.use('/client', express.static(path.resolve(__dirname, 'client')));
app.set('view engine', 'ejs');

io.on('connection', (socket) => {

    if (io.sockets.sockets.size > 2) {
        console.log('Not place. Await')
        socket.disconnect(); // Только для клиента могут находится на страничке и что-то делать
    }

    const socketIdPlayer = socket.id;
    joinPlayers(socketIdPlayer, players);

    const idPlayer = getKeyByValue(players, socketIdPlayer) //1-крестик; 2-нолик
    socket.emit('clientId', idPlayer);

    if (io.sockets.sockets.size === 2 && !started) {
        console.log('зАшёл')
        started = true;
        io.emit('start', activePlayer);
    }

    socket.on('paramsPlayer', data => { //Установка имен игроков и времени
        const idName = getKeyByValue(players, socket.id);
        if (data.time) {
            timerGame = data.time;
        }
        io.emit('installName', {
            name: data.name,
            time: data.time,
            id: idName
        })
        io.emit('installTime', {
            time: timerGame,
            id: idName
        });
    })

    socket.on('createMessage', (data) => {
        const idName = getKeyByValue(players, socket.id);
        console.log(data.name);
        MessageController.create(data, idName);
        io.emit('newMessage', {
            name: data.name,
            text: data.text,
            id: idName,
            createdAt: new Date().getTime()
        });
    })

    if (started) {
        MessageController.getAll().then((data)=>{socket.emit('reload', activePlayer, field.getField(), data)})
    }// catch и finally не стал использовать

    function resultMatch(gameOver, end, result) {
        if (gameOver || end) {
            console.log(result['id'] != 0 ? `Game over! The winner is player ${idPlayer}` : `Game over! Draw`)
            field.resetField();
            started = false;
            gameOver = false;   // тело этой функции можно запихнуть в обработчик события turn
            activePlayer = 1;   // но я разделил, чтобы когда таймер заканчивался игра прекращалась
            io.emit('result', result);
        }
    }
    socket.on('turn', (turn, end) => { // обработчик события отвечающий за сделанный ход
        console.log(`Turn by ${idPlayer}: ${turn.x}, ${turn.y}`);
        let result = field.checkGameOver(idPlayer);
        gameOver = result['result'];
        if (gameOver) return;
        if (gameOver || end) {
            resultMatch(false, end, result)
            return;
        }
        activePlayer = 3 - activePlayer;
        field.setCell(turn.x, turn.y, idPlayer);
        io.emit('turn', {
            'x': turn.x,
            'y': turn.y,
            'next': activePlayer
        });
        result = field.checkGameOver(idPlayer);
        gameOver = result['result'];
        resultMatch(gameOver, end, result)
    })


    socket.on('removeDataFrom_BD', () => {
        MessageController.removeAll();
    })

    socket.on('disconnect', () => {
        const player = getKeyByValue(players, socket.id);
        players[player] = '';
        console.log(`End ${players}`)
    })
})

app.get('/', (req, res) => {
    res.render(path.resolve(__dirname, 'server', 'views/index'))
})

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        server.listen(PORT, () => console.log(`${PORT}`))
    } catch (error) {
        console.log(error)
    }
}
start();


