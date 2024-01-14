const express = require('express');
const cors = require('cors');
const app = express();
const checkAuction = require('./checkAuction');
const checkUser = require('./checkUser');
const cserver = require('http').createServer(app); // http 서버 생성
const aserver = require('http').createServer(app); // http 서버 생성
const cio = require('socket.io')(cserver, {
    cors: {
        origin: 'http://localhost:8080',
        credentials: true,
    },
    allowEIO3: true,
    pingTimeout: 5000,
}); // socket.io 서버 생성
const aio = require('socket.io')(aserver, {
    cors: {
        origin: 'http://localhost:8080',
        credentials: true,
    },
    allowEIO3: true,
    pingTimeout: 5000,
}); // socket.io 서버 생성

app.use(cors({      // cors 설정을 해줘야 front 서버와 통신 가능
    origin: 'http://localhost:8080',
    credentials: true,
}));

cio.on('connection', function(socket) {
    socket.on('chat', function(data){
        const msg = {
            chatroom_no : data.chatroom_no,
            chat_content : data.chat_content,
            user_no : data.user_no,
        }
        socket.broadcast.emit('chat', msg);
    });
});

aio.on('connection', function(socket) {
    socket.on('auction', function(data){
        const msg = {
            bid_amount : data.bid_amount,
            goods_no : data.goods_no,
            user_no : data.user_no,
        }
        socket.broadcast.emit('auction', msg);
    });
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRouter = require('./routes/auth');
const goodsRouter = require('./routes/goods');
const mypageRouter = require('./routes/mypage');
const chatRouter = require('./routes/chat');

app.use('/auth', authRouter);
app.use('/goods', goodsRouter);
app.use('/mypage', mypageRouter);
app.use('/chat', chatRouter);
checkAuction();
checkUser();
app.listen(3000, function() {
    console.log('Server Running at http://localhost:3000');
});

cserver.listen(3001, function() {
    console.log('Socket IO Server Running at http://localhost:3001');
})

aserver.listen(3002, function() {
    console.log('Socket IO Server Running at http://localhost:3002');
})