const isEmail = (email) => {
	const regEx =
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (email?.match(regEx)) return true;
	else return false;
};

const isEmpty = (string) => {
	if (string?.trim() === '') return true;
	else return false;
};

exports.validateRegistration = (data) => {
	let errors = {};

	if (isEmpty(data?.firstName)) errors.firstName = 'Must not be empty!';
	if (isEmpty(data?.lastName)) errors.lastName = 'Must not be empty!';
	if (isEmpty(data?.dob)) errors.dob = 'Must not be empty!';
	if (isEmpty(data?.username)) errors.username = 'Must not be empty!';
	if (isEmpty(data?.email)) {
		errors.email = 'Must not be empty!';
	} else if (!isEmail(data?.email)) {
		errors.email = 'Must be a valid email address!';
	}
	if (isEmpty(data?.password)) errors.password = 'Must not be empty!';
	if (isEmpty(data?.confirmPassword)) {
		errors.confirm = 'Must not be empty!';
	} else if (data?.confirmPassword !== data?.password) {
		errors.confirm = 'Passwords do not match!';
	}

	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false,
	};
};

exports.validateLogin = (data) => {
	let errors = {};

	if (isEmpty(data?.login)) errors.login = 'Must not be empty!';
	if (isEmpty(data?.password)) errors.password = 'Must not be empty!';

	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false,
	};
};

exports.validateCreateChat = (data) => {
	let errors = {};

	if (!data.users || data.users.length === 0)
		errors.users = "Can't start a chat without recipients!";

	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false,
	};
};

exports.validateMessage = (data) => {
	let errors = {};

	if (!data.content || !data.chatId)
		errors.message = 'Invalid data passed to request';
	if (isEmpty(data?.content)) errors.content = 'Must not be empty!';

	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false,
	};
};
