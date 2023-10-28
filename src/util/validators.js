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

	if (isEmail(data?.firstName)) errors.firstName = 'Must not be empty!';
	if (isEmail(data?.lastName)) errors.lastName = 'Must not be empty!';
	if (isEmail(data?.username)) errors.username = 'Must not be empty!';
	if (isEmpty(data?.email)) {
		errors.email = 'Must not be empty!';
	} else if (!isEmail(data?.email)) {
		errors.email = 'Must be a valid email address!';
	}
	if (isEmail(data?.password)) errors.password = 'Must not be empty!';

	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false,
	};
};
