const { admin, db } = require('./admin');

module.exports = (request, response, next) => {
	let idToken;
	if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
		idToken = request.headers.authorization.split('Bearer ')[1];
	} else {
		console.error('No token found');
		return response.status(403).json({ error: 'Unauthorized' });
	}
	admin
		.auth()
		.verifyIdToken(idToken)
		.then((decodedToken) => {
			request.user = decodedToken;
			return db.collection('users').where('userId', '==', request.user.uid).limit(1).get();
		})
		.then((data) => {
			if (data.empty) {
				return response.status(403).json({ error: 'User profile not found' });
			}
			const userData = data.docs[0].data();
			request.user.username = userData.username;
			request.user.imageUrl = userData.imageUrl;
			request.user.householdId = userData.householdId || null;
			request.user.memberId = userData.memberId || null;
			request.user.role = userData.role || null;
			return next();
		})
		.catch((err) => {
			console.error('Error while verifying token', err);
			return response.status(403).json(err);
		});
};
