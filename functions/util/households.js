const DEFAULT_CATEGORIES = [
	{ ID: 1, Name: 'Rent', ExpectedValue: 1200 },
	{ ID: 2, Name: 'Charity', ExpectedValue: 1200 },
	{ ID: 3, Name: 'Food', ExpectedValue: 500 },
	{ ID: 4, Name: 'Electricity', ExpectedValue: 100 },
	{ ID: 5, Name: 'Internet', ExpectedValue: 40 },
	{ ID: 6, Name: 'Insurance', ExpectedValue: 75 },
	{ ID: 7, Name: 'Expenses', ExpectedValue: 285 },
	{ ID: 8, Name: 'Fuel', ExpectedValue: 100 }
];

const seedDefaultCategories = (batch, householdRef) => {
	DEFAULT_CATEGORIES.forEach((category) => {
		const categoryRef = householdRef.collection('categories').doc(String(category.ID));
		batch.set(categoryRef, {
			...category,
			createdAt: new Date().toISOString()
		});
	});
};

const ensureHousehold = (request, response) => {
	if (!request.user.householdId) {
		response.status(400).json({ needsHouseholdSetup: true, error: 'Household setup required' });
		return null;
	}
	return request.user.householdId;
};

const requireHouseholdOwner = (request, response) => {
	const householdId = ensureHousehold(request, response);
	if (!householdId) return null;
	if (request.user.role !== 'owner') {
		response.status(403).json({ error: 'Only the main householder can manage this resource' });
		return null;
	}
	return householdId;
};

module.exports = {
	DEFAULT_CATEGORIES,
	ensureHousehold,
	requireHouseholdOwner,
	seedDefaultCategories
};
