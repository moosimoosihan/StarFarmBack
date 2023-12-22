const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({      // cors 설정을 해줘야 front 서버와 통신 가능
    origin: 'http://localhost:8080',
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRouter = require('./routes/auth');
//const goodsRouter = require('./routes/goods');
//const mypageRouter = require('./routes/mypage');
//const chatRouter = require('./routes/chat');

app.use('/auth', authRouter);
//app.use('/goods', goodsRouter);
//app.use('/mypage', mypageRouter);
//app.use('/chat', chatRouter);

app.listen(3000, function() {
    console.log('Server Running at http://localhost:3000');
});