const { db } = require('../util/admin');
exports.getOwners = (request, response) => {
	db
		.collection('owners')
        .orderBy('ID', 'asc')
		.get()
		.then((data) => {
			let owners = [];
			data.forEach((doc) => {
				owners.push({
                    ownerId: doc.data().ID,
                    ownerName: doc.data().Name,
                    Amount: doc.data().Amount,
				});
			});
			return response.json(owners);
		})
		.catch((err) => {
			console.error(err);
			return response.status(500).json({ error: err.code});
		});
};

exports.getCollections = (request, response) => {
	db
		.collection('collections')
        .orderBy('ID', 'asc')
		.get()
		.then((data) => {
			let collections = [];
			data.forEach((doc) => {
				collections.push({
                    collectionId: doc.data().ID,
                    collectionName: doc.data().Name,
					Amount:  doc.data().Amount
				});
			});
			return response.json(collections);
		})
		.catch((err) => {
			console.error(err);
			return response.status(500).json({ error: err.code});
		});
};