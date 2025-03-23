const mongoose = require('mongoose');
const express = require('express');
const connect = require('./connection');
const cors = require('cors');
const http = require('http'); // لإعداد خادم HTTP
const { Server } = require('socket.io'); // استيراد مكتبة socket.io




// إعداد تطبيق Express
const app = express();

// إعداد خادم HTTP
const server = http.createServer(app);

// إعداد WebSocket server
const io = new Server(server, {
    cors: {
        origin: "*", // السماح بكل الطلبات
        methods: ["GET", "POST"]
    }
});

const PORT = 3002 || process.env.PORT;

app.use(cors());
app.use(express.json());

const conversationsRoute = require('./routes/conversation');
const messagesRoute = require('./routes/message');
const userRoute = require('./routes/user');
const invitationRoute = require('./routes/invitation');
const relation = require('./routes/relation');
const emailDealing = require('./routes/emailDealing');

app.use('/api', conversationsRoute);
app.use('/api', messagesRoute);
app.use('/api', userRoute);
app.use('/api', invitationRoute);
app.use('/api', relation);
app.use('/api', emailDealing);
// app.use('/api', block);

// WebSocket connections handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // استقبال الرسائل من العميل
    socket.on('sendMessage', (messageData) => {
        // إرسال الرسالة لجميع العملاء المتصلين
        socket.broadcast.emit('receiveMessage', messageData);
    });

    // التعامل مع فصل الاتصال
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

// تشغيل الخادم
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});































// const mongoose = require('mongoose')
// const express = require('express');
// const cors = require('cors');
// const connect = require('./connection');
// const { json } = require('body-parser');

// const app = express();

// const PORT = 3002;

// app.use(cors());
// app.use(express.json());

// const conversationsRoute = require('./routes/conversation');
// const messagesRoute = require('./routes/message')
// const userRoute = require('./routes/user')
// const invitationRoute = require('./routes/invitation');
// const relation = require('./routes/relation');

// app.use('/api', conversationsRoute);
// app.use('/api', messagesRoute);
// app.use('/api',userRoute);
// app.use('/api',invitationRoute);
// app.use('/api', relation);


// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
//   });



