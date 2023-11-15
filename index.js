require('./src/models/User');
require('./src/models/Post');
const { config } = require('dotenv');
const { set, connect, connection } = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./src/routes/UserRoutes');
const postRoutes = require('./src/routes/PostRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
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

const port = process.env.PORT || 3005;

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
