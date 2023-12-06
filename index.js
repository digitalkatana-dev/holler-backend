require('./src/models/User');
require('./src/models/Post');
require('./src/models/Chat');
require('./src/models/Message');
const { config } = require('dotenv');
const { set, connect, connection } = require('mongoose');
const { Server } = require('socket.io');
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const uploadRoutes = require('./src/routes/uploadRoutes');
const userRoutes = require('./src/routes/UserRoutes');
const postRoutes = require('./src/routes/PostRoutes');
const chatRoutes = require('./src/routes/ChatRoutes');
const messageRoutes = require('./src/routes/MessageRoutes');
config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

set('strictQuery', false);

connect(process.env.MONGODB_URL, {
	useUnifiedTopology: true,
	useNewUrlParser: true,
});

connection.on('connected', () => {
	console.log('Connected to db.');
});
connection.on('error', (err) => {
	console.log('Error connecting to db.', err);
});

app.use(uploadRoutes);
app.use(userRoutes);
app.use(postRoutes);
app.use(chatRoutes);
app.use(messageRoutes);

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: 'http://localhost:3000',
		methods: ['GET', 'POST'],
	},
	pingTimeout: 60000,
});

const port = process.env.PORT || 3005;

io.on('connection', (socket) => {
	socket.on('setup', (userData) => {
		console.log(`User connected: ${userData._id}`);
		socket.join(userData._id);
		socket.emit('connected');
	});

	socket.on('join room', (room) => {
		socket.join(room);
		socket.emit('joined');
	});

	socket.on('typing', (room) => {
		socket.in(room).emit('typing');
	});

	socket.on('stop typing', (room) => {
		socket.in(room).emit('stop typing');
	});

	socket.on('new message', (newMessage) => {
		// console.log('Message', newMessage);
		let chat = newMessage.chat;
		if (!chat.users) return console.log('Chat.users not defined');

		chat.users.forEach((user) => {
			if (user == newMessage.sender._id) return;
			socket.in(user).emit('message received');
		});
	});
});

server.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
