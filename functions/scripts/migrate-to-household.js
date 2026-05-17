const { db } = require('../util/admin');
const { DEFAULT_CATEGORIES } = require('../util/households');

const normalize = (value) => String(value || '').trim().toLowerCase();

const run = async () => {
	const householdName = process.env.HOUSEHOLD_NAME || 'Brotherhood House';
	const ownerUsername = process.env.OWNER_USERNAME || '';

	const existingHouseholdSnapshot = await db
		.collection('households')
		.where('name', '==', householdName)
		.limit(1)
		.get();

	const householdRef = existingHouseholdSnapshot.empty
		? db.collection('households').doc()
		: existingHouseholdSnapshot.docs[0].ref;

	const now = new Date().toISOString();
	let batch = db.batch();
	let opCount = 0;

	const commitIfNeeded = async () => {
		if (opCount >= 450) {
			await batch.commit();
			batch = db.batch();
			opCount = 0;
		}
	};

	const setDoc = async (ref, data, options) => {
		batch.set(ref, data, options);
		opCount += 1;
		await commitIfNeeded();
	};

	const updateDoc = async (ref, data) => {
		batch.update(ref, data);
		opCount += 1;
		await commitIfNeeded();
	};

	if (existingHouseholdSnapshot.empty) {
		await setDoc(householdRef, {
			name: householdName,
			createdBy: ownerUsername || 'migration',
			createdAt: now,
			updatedAt: now,
			migratedFromLegacy: true
		});
	}

	const legacyOwners = await db.collection('owners').orderBy('ID', 'asc').get();
	const ownerNameToMemberId = {};

	for (const doc of legacyOwners.docs) {
		const data = doc.data();
		const memberId = String(data.ID);
		const memberRef = householdRef.collection('members').doc(memberId);
		const [firstName = data.Name || '', ...lastNameParts] = String(data.Name || '').split(' ');
		const member = {
			firstName,
			lastName: lastNameParts.join(' '),
			email: data.Email || '',
			phoneNumber: data.PhoneNumber || '',
			role: 'member',
			active: true,
			legacyOwnerId: data.ID,
			createdAt: now
		};

		ownerNameToMemberId[normalize(data.Name)] = memberId;
		await setDoc(memberRef, member, { merge: true });
	}

	const usersSnapshot = await db.collection('users').get();
	for (const doc of usersSnapshot.docs) {
		const user = doc.data();
		const displayName = normalize(`${user.firstName || ''} ${user.lastName || ''}`);
		let memberId = ownerNameToMemberId[displayName] || doc.id;
		const isOwner = ownerUsername ? doc.id === ownerUsername : usersSnapshot.docs[0].id === doc.id;
		const memberRef = householdRef.collection('members').doc(memberId);

		await setDoc(memberRef, {
			userId: user.userId,
			username: user.username || doc.id,
			firstName: user.firstName || '',
			lastName: user.lastName || '',
			email: user.email || '',
			phoneNumber: user.phoneNumber || '',
			role: isOwner ? 'owner' : 'member',
			active: true,
			createdAt: user.createdAt || now
		}, { merge: true });

		await updateDoc(doc.ref, {
			householdId: householdRef.id,
			memberId,
			role: isOwner ? 'owner' : 'member'
		});
	}

	const categorySnapshot = await db.collection('collections').orderBy('ID', 'asc').get();
	if (categorySnapshot.empty) {
		for (const category of DEFAULT_CATEGORIES) {
			await setDoc(householdRef.collection('categories').doc(String(category.ID)), {
				...category,
				createdAt: now
			});
		}
	} else {
		for (const doc of categorySnapshot.docs) {
			const data = doc.data();
			const categoryId = String(data.ID);
			await setDoc(householdRef.collection('categories').doc(categoryId), {
				...data,
				ExpectedValue: Number(data.ExpectedValue || data.expectedValue || 0),
				createdAt: data.createdAt || now
			}, { merge: true });
		}
	}

	const paymentsSnapshot = await db.collection('payments').get();
	for (const doc of paymentsSnapshot.docs) {
		await setDoc(householdRef.collection('payments').doc(doc.id), doc.data(), { merge: true });
	}

	if (opCount > 0) {
		await batch.commit();
	}

	console.log(`Migrated legacy data into household ${householdRef.id} (${householdName}).`);
	console.log(`Users migrated: ${usersSnapshot.size}`);
	console.log(`Members migrated from owners: ${legacyOwners.size}`);
	console.log(`Categories migrated: ${categorySnapshot.size || 'default set'}`);
	console.log(`Payments migrated: ${paymentsSnapshot.size}`);
};

run()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
