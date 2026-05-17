const { db } = require('../util/admin');

const defaultExpectedValues = {
	Rent: 1200,
	Charity: 1200,
	Food: 500,
	Electricity: 100,
	Internet: 40,
	Insurance: 75,
	Expenses: 285,
	Fuel: 100
};

const getCategoryExpectedValue = (data) => {
	const value = data.ExpectedValue !== undefined ? data.ExpectedValue : data.expectedValue;
	const numericValue = Number(value);
	if (Number.isFinite(numericValue)) {
		return numericValue;
	}
	return defaultExpectedValues[data.Name] || 0;
};

const findCollectionById = async (collectionId) => {
	const idValue = String(collectionId);
	const numericId = Number(idValue);
	const idValues = Number.isNaN(numericId) ? [idValue] : [idValue, numericId];

	const snapshot = await db
		.collection('collections')
		.where('ID', 'in', idValues)
		.limit(1)
		.get();

	if (snapshot.empty) {
		return null;
	}

	return snapshot.docs[0];
};

const findScopedCollectionById = async (request, collectionId) => {
	const idValue = String(collectionId);
	const numericId = Number(idValue);
	const idValues = Number.isNaN(numericId) ? [idValue] : [idValue, numericId];

	const snapshot = await getCollectionsRef(request)
		.where('ID', 'in', idValues)
		.limit(1)
		.get();

	if (snapshot.empty) {
		return null;
	}

	return snapshot.docs[0];
};

const getCollectionsRef = (request) => {
	if (request.user.householdId) {
		return db.collection('households').doc(request.user.householdId).collection('categories');
	}
	return db.collection('collections');
};

const getMemberName = (data) => {
	return [data.firstName, data.lastName].filter(Boolean).join(' ').trim() || data.username || data.email || 'Member';
};

exports.getOwners = (request, response) => {
	const source = request.user.householdId
		? db.collection('households').doc(request.user.householdId).collection('members')
		: db.collection('owners');

	source
		.orderBy(request.user.householdId ? 'createdAt' : 'ID', 'asc')
			.get()
			.then((data) => {
				let owners = [];
				data.forEach((doc) => {
					const ownerData = doc.data();
					owners.push({
						ownerId: request.user.householdId ? doc.id : ownerData.ID,
						ownerName: request.user.householdId ? getMemberName(ownerData) : ownerData.Name,
						role: ownerData.role,
						active: ownerData.active
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
	getCollectionsRef(request)
        .orderBy('ID', 'asc')
		.get()
		.then((data) => {
			let collections = [];
			data.forEach((doc) => {
				const collectionData = doc.data();
				collections.push({
					docId: doc.id,
                    collectionId: collectionData.ID,
                    collectionName: collectionData.Name,
					expectedValue: getCategoryExpectedValue(collectionData)
				});
			});
			return response.json(collections);
		})
		.catch((err) => {
			console.error(err);
			return response.status(500).json({ error: err.code});
		});
};

exports.postCollection = async (request, response) => {
	const name = String(request.body.Name || request.body.collectionName || '').trim();
	const expectedValue = Number(request.body.ExpectedValue !== undefined ? request.body.ExpectedValue : request.body.expectedValue);

	if (name === '') {
		return response.status(400).json({ collectionName: 'Must not be empty' });
	}

	if (!Number.isFinite(expectedValue) || expectedValue < 0) {
		return response.status(400).json({ expectedValue: 'Must be a valid positive number' });
	}

	try {
		const collectionsRef = getCollectionsRef(request);
		const existing = await collectionsRef
			.where('Name', '==', name)
			.limit(1)
			.get();

		if (!existing.empty) {
			return response.status(400).json({ collectionName: 'Category already exists' });
		}

		const snapshot = await collectionsRef.select('ID').get();
		let maxId = 0;
		snapshot.forEach((doc) => {
			const value = Number(doc.data().ID);
			if (Number.isFinite(value) && value > maxId) {
				maxId = value;
			}
		});

		const newCollection = {
			ID: maxId + 1,
			Name: name,
			ExpectedValue: expectedValue
		};

		const docRef = request.user.householdId
			? collectionsRef.doc(String(newCollection.ID))
			: collectionsRef.doc();
		await docRef.set(newCollection);
		return response.json({
			docId: docRef.id,
			collectionId: newCollection.ID,
			collectionName: newCollection.Name,
			expectedValue: newCollection.ExpectedValue
		});
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: err.code || 'Failed to create category' });
	}
};

exports.editCollection = async (request, response) => {
	const editableCollection = {};

	if (request.body.Name !== undefined || request.body.collectionName !== undefined) {
		const name = String(request.body.Name !== undefined ? request.body.Name : request.body.collectionName).trim();
		if (name === '') {
			return response.status(400).json({ collectionName: 'Must not be empty' });
		}
		editableCollection.Name = name;
	}

	if (request.body.ExpectedValue !== undefined || request.body.expectedValue !== undefined) {
		const expectedValue = Number(request.body.ExpectedValue !== undefined ? request.body.ExpectedValue : request.body.expectedValue);
		if (!Number.isFinite(expectedValue) || expectedValue < 0) {
			return response.status(400).json({ expectedValue: 'Must be a valid positive number' });
		}
		editableCollection.ExpectedValue = expectedValue;
	}

	if (Object.keys(editableCollection).length === 0) {
		return response.status(400).json({ error: 'No editable fields provided' });
	}

	try {
		const collectionDoc = request.user.householdId
			? await findScopedCollectionById(request, request.params.collectionId)
			: await findCollectionById(request.params.collectionId);
		if (!collectionDoc) {
			return response.status(404).json({ error: 'Category not found' });
		}

		if (editableCollection.Name) {
			const duplicate = await getCollectionsRef(request)
				.where('Name', '==', editableCollection.Name)
				.limit(1)
				.get();

			if (!duplicate.empty && duplicate.docs[0].id !== collectionDoc.id) {
				return response.status(400).json({ collectionName: 'Category already exists' });
			}
		}

		const collectionsRef = getCollectionsRef(request);
		await collectionsRef.doc(collectionDoc.id).update(editableCollection);
		const updatedDoc = await collectionsRef.doc(collectionDoc.id).get();
		const updatedData = updatedDoc.data();

		return response.json({
			message: 'Updated successfully',
			docId: updatedDoc.id,
			collectionId: updatedData.ID,
			collectionName: updatedData.Name,
			expectedValue: getCategoryExpectedValue(updatedData)
		});
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: err.code || 'Failed to update category' });
	}
};

exports.deleteCollection = async (request, response) => {
	try {
		const collectionDoc = request.user.householdId
			? await findScopedCollectionById(request, request.params.collectionId)
			: await findCollectionById(request.params.collectionId);
		if (!collectionDoc) {
			return response.status(404).json({ error: 'Category not found' });
		}

		await getCollectionsRef(request).doc(collectionDoc.id).delete();
		return response.json({ message: 'Delete successful' });
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: err.code || 'Failed to delete category' });
	}
};
