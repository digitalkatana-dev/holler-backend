require('./src/models/User');
const { config } = require('dotenv');
const { set, connect, connection } = require('mongoose');
const express = require('express');
const cors = require('cors');
config();

const app = express();
app.use(cors());
app.use(express.json());

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

const port = process.env.PORT || 3005;

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
