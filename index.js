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
});

const port = process.env.PORT || 3005;

io.on('connection', (socket) => {
	console.log(`User connected: ${socket.id}`);
});

server.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
