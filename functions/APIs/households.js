const { db } = require('../util/admin');
const { requireHouseholdOwner, seedDefaultCategories } = require('../util/households');
const functions = require('firebase-functions');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const APP_FALLBACK_ORIGIN = 'https://brotherhood-edc8d.web.app';

const getMemberName = (member) => {
	return [member.firstName, member.lastName].filter(Boolean).join(' ').trim() || member.username || member.email || 'Member';
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const ALLOWED_ORIGINS = [
	'https://brotherhood-edc8d.web.app',
	'https://brotherhood-p.xyz',
	'http://localhost:3000',
	'http://127.0.0.1:3000',
	'http://localhost:3001',
	'http://127.0.0.1:3001'
];

const isEmail = (email) => {
	const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return emailRegEx.test(String(email || ''));
};

const isPhoneNumber = (phoneNumber) => {
	if (!phoneNumber) return true;
	const normalized = String(phoneNumber).replace(/[\s().-]/g, '');
	return /^\+?[0-9]{7,15}$/.test(normalized);
};

const getInvitePayload = (request, member) => {
	const origin = request.get('origin');
	const appOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : APP_FALLBACK_ORIGIN;
	const inviteUrl = `${appOrigin}/household?invite=${member.inviteToken}`;
	const signupUrl = `${appOrigin}/signup?invite=${member.inviteToken}`;
	const subject = 'Your Brotherhood household invite';
	const text = `Hi ${member.firstName || 'there'},

You have been invited to join ${request.user.username}'s Brotherhood household.

New to Brotherhood? Register here:
${signupUrl}

Already have an account? Sign in here and we will connect you automatically:
${inviteUrl}

After signup, please verify your email before signing in.`;
	const html = `
		<p>Hi ${member.firstName || 'there'},</p>
		<p>You have been invited to join ${request.user.username}'s Brotherhood household.</p>
		<p><a href="${signupUrl}">Register and join the household</a></p>
		<p>Already have an account? <a href="${inviteUrl}">Sign in and connect automatically</a>.</p>
		<p>After signup, please verify your email before signing in.</p>
	`;

	return {
		inviteUrl,
		signupUrl,
		mailtoUrl: `mailto:${encodeURIComponent(member.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
		email: {
			subject,
			text,
			html
		}
	};
};

const queueInviteEmail = async (request, member, householdName = '') => {
	if (!isEmail(member.email)) return null;

	const payload = getInvitePayload(request, member);
	const mailRef = db.collection('mail').doc();
	await mailRef.set({
		to: [member.email],
		message: {
			subject: householdName
				? `Join ${householdName} on Brotherhood`
				: payload.email.subject,
			text: payload.email.text,
			html: payload.email.html
		},
		inviteToken: member.inviteToken,
		memberEmail: member.email,
		status: 'queued',
		createdAt: new Date().toISOString()
	});

	return {
		...payload,
		emailQueued: true,
		mailId: mailRef.id
	};
};

const sendInviteEmail = async (request, member, householdName = '') => {
	if (!isEmail(member.email)) return null;

	const config = functions.config().smtp || {};
	if (!config.host || !config.port || !config.user || !config.password || !config.from) {
		return null;
	}

	const payload = getInvitePayload(request, member);
	const transporter = nodemailer.createTransport({
		host: config.host,
		port: Number(config.port),
		secure: Number(config.port) === 465,
		auth: {
			user: config.user,
			pass: config.password
		}
	});

	const info = await transporter.sendMail({
		from: config.from,
		to: member.email,
		subject: householdName
			? `Join ${householdName} on Brotherhood`
			: payload.email.subject,
		text: payload.email.text,
		html: payload.email.html
	});

	return {
		...payload,
		emailSent: true,
		messageId: info.messageId || ''
	};
};

const deliverInvite = async (request, member, householdName = '') => {
	const payload = getInvitePayload(request, member);
	const smtpPayload = await sendInviteEmail(request, member, householdName).catch((err) => {
		console.error('Failed to send invite email through SMTP', err);
		return null;
	});

	if (smtpPayload) {
		return {
			...smtpPayload,
			emailQueued: false
		};
	}

	const emailPayload = await queueInviteEmail(request, member, householdName).catch((err) => {
		console.error('Failed to queue invite email', err);
		return null;
	});

	return {
		...payload,
		emailSent: false,
		emailQueued: Boolean(emailPayload),
		mailId: emailPayload ? emailPayload.mailId : null
	};
};

const findInviteMember = async (predicate) => {
	const householdsSnapshot = await db.collection('households').get();

	for (const householdDoc of householdsSnapshot.docs) {
		const membersSnapshot = await householdDoc.ref.collection('members').get();
		const memberDoc = membersSnapshot.docs.find((doc) => predicate(doc.data()));
		if (memberDoc) {
			return {
				memberDoc,
				memberData: memberDoc.data(),
				householdRef: householdDoc.ref
			};
		}
	}

	return null;
};

const findInviteByToken = (inviteToken) => {
	const token = String(inviteToken || '').trim();
	if (!token) return null;

	return findInviteMember((member) => (
		member.inviteToken === token
	));
};

const findPendingInviteByEmail = (email) => {
	const normalizedEmail = normalizeEmail(email);
	if (!normalizedEmail) return null;

	return findInviteMember((member) => (
		normalizeEmail(member.email) === normalizedEmail &&
		member.active !== false &&
		!member.userId &&
		member.inviteToken &&
		member.inviteStatus === 'pending'
	));
};

const attachUserToInvite = async ({ userRef, userData, uid, email }) => {
	if (userData.householdId) {
		return null;
	}

	const invite = await findPendingInviteByEmail(email || userData.email);
	if (!invite) {
		return null;
	}

	const now = new Date().toISOString();
	const batch = db.batch();
	batch.update(invite.memberDoc.ref, {
		userId: uid || userData.userId,
		username: userData.username,
		firstName: userData.firstName || invite.memberData.firstName || '',
		lastName: userData.lastName || invite.memberData.lastName || '',
		email: normalizeEmail(userData.email || email || invite.memberData.email),
		phoneNumber: userData.phoneNumber || invite.memberData.phoneNumber || '',
		role: 'member',
		active: true,
		inviteStatus: 'accepted',
		inviteAcceptedAt: now,
		updatedAt: now
	});
	batch.update(userRef, {
		householdId: invite.householdRef.id,
		memberId: invite.memberDoc.id,
		role: 'member',
		active: true,
		updatedAt: now
	});
	await batch.commit();

	return {
		householdId: invite.householdRef.id,
		memberId: invite.memberDoc.id,
		role: 'member'
	};
};

const getHouseholdName = async (householdId) => {
	const householdDoc = await db.collection('households').doc(householdId).get();
	return householdDoc.exists ? householdDoc.data().name || '' : '';
};

exports.attachUserToPendingInvite = attachUserToInvite;

exports.findPendingInviteByEmail = findPendingInviteByEmail;
exports.findInviteByToken = findInviteByToken;

const buildInviteFields = () => ({
	inviteToken: crypto.randomBytes(24).toString('hex'),
	inviteStatus: 'pending',
	inviteCreatedAt: new Date().toISOString()
});

const commitBatch = async (state) => {
	if (state.count === 0) return;
	await state.batch.commit();
	state.batch = db.batch();
	state.count = 0;
};

const queueSet = async (state, ref, data, options = { merge: true }) => {
	state.batch.set(ref, data, options);
	state.count += 1;
	if (state.count >= 450) {
		await commitBatch(state);
	}
};

const splitName = (name) => {
	const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
	return {
		firstName: parts[0] || 'Legacy',
		lastName: parts.slice(1).join(' ')
	};
};

exports.getHousehold = async (request, response) => {
	try {
		if (!request.user.householdId) {
			return response.json({ needsHouseholdSetup: true });
		}

		const householdDoc = await db.collection('households').doc(request.user.householdId).get();
		if (!householdDoc.exists) {
			return response.status(404).json({ error: 'Household not found' });
		}

		return response.json({
			householdId: householdDoc.id,
			...householdDoc.data(),
			currentUserRole: request.user.role,
			currentMemberId: request.user.memberId
		});
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: err.code || 'Failed to fetch household' });
	}
};

exports.createHousehold = async (request, response) => {
	const name = String(request.body.name || request.body.householdName || '').trim();
	if (name === '') {
		return response.status(400).json({ householdName: 'Must not be empty' });
	}

	if (request.user.householdId) {
		return response.status(400).json({ error: 'User already belongs to a household' });
	}

	try {
		const userRef = db.collection('users').doc(request.user.username);
		const userDoc = await userRef.get();
		if (!userDoc.exists) {
			return response.status(404).json({ error: 'User not found' });
		}

		const userData = userDoc.data();
		const householdRef = db.collection('households').doc();
		const memberRef = householdRef.collection('members').doc(request.user.username);
		const now = new Date().toISOString();
		const batch = db.batch();

		batch.set(householdRef, {
			name,
			createdBy: request.user.username,
			createdAt: now,
			updatedAt: now
		});

		batch.set(memberRef, {
			userId: request.user.uid,
			username: request.user.username,
			firstName: userData.firstName,
			lastName: userData.lastName,
			email: userData.email,
			phoneNumber: userData.phoneNumber || '',
			role: 'owner',
			active: true,
			createdAt: now
		});

		seedDefaultCategories(batch, householdRef);

		batch.update(userRef, {
			householdId: householdRef.id,
			memberId: memberRef.id,
			role: 'owner'
		});

		await batch.commit();

		return response.status(201).json({
			householdId: householdRef.id,
			name,
			memberId: memberRef.id,
			role: 'owner'
		});
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: err.code || 'Failed to create household' });
	}
};

exports.updateHousehold = async (request, response) => {
	const householdId = requireHouseholdOwner(request, response);
	if (!householdId) return;

	const name = String(request.body.name || request.body.householdName || '').trim();
	if (name === '') {
		return response.status(400).json({ householdName: 'Must not be empty' });
	}

	try {
		await db.collection('households').doc(householdId).update({
			name,
			updatedAt: new Date().toISOString()
		});
		return response.json({ message: 'Updated successfully', householdId, name });
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: err.code || 'Failed to update household' });
	}
};

exports.importLegacyHouseholdData = async (request, response) => {
	const householdId = requireHouseholdOwner(request, response);
	if (!householdId) return;

	try {
		const householdRef = db.collection('households').doc(householdId);
		const householdDoc = await householdRef.get();
		if (!householdDoc.exists) {
			return response.status(404).json({ error: 'Household not found' });
		}

		const now = new Date().toISOString();
		const batchState = {
			batch: db.batch(),
			count: 0
		};

		const [ownersSnapshot, categoriesSnapshot, paymentsSnapshot] = await Promise.all([
			db.collection('owners').get(),
			db.collection('collections').get(),
			db.collection('payments').get()
		]);

		for (const ownerDoc of ownersSnapshot.docs) {
			const owner = ownerDoc.data();
			const memberId = String(owner.ID || ownerDoc.id);
			const ownerName = owner.Name || owner.ownerName || memberId;
			const { firstName, lastName } = splitName(ownerName);

			await queueSet(batchState, householdRef.collection('members').doc(memberId), {
				firstName,
				lastName,
				email: owner.email || '',
				phoneNumber: owner.phoneNumber || '',
				role: 'member',
				active: true,
				createdAt: owner.createdAt || now,
				legacyOwnerId: owner.ID || ownerDoc.id,
				legacyOwnerName: ownerName,
				migratedFromGlobalData: true,
				migratedAt: now
			});
		}

		for (const categoryDoc of categoriesSnapshot.docs) {
			const category = categoryDoc.data();
			const categoryId = String(category.ID || categoryDoc.id);

			await queueSet(batchState, householdRef.collection('categories').doc(categoryId), {
				...category,
				ID: category.ID || categoryId,
				Name: category.Name || category.name || categoryId,
				ExpectedValue: Number(category.ExpectedValue || category.expectedValue || 0),
				createdAt: category.createdAt || now,
				migratedFromGlobalData: true,
				migratedAt: now
			});
		}

		for (const paymentDoc of paymentsSnapshot.docs) {
			await queueSet(batchState, householdRef.collection('payments').doc(paymentDoc.id), {
				...paymentDoc.data(),
				migratedFromGlobalData: true,
				migratedAt: now,
				legacySourcePath: `payments/${paymentDoc.id}`
			});
		}

		await queueSet(batchState, householdRef, {
			legacyDataMigratedAt: now,
			legacyDataMigratedBy: request.user.username,
			legacyDataMigrationCounts: {
				members: ownersSnapshot.size,
				categories: categoriesSnapshot.size,
				transactions: paymentsSnapshot.size
			}
		});
		await commitBatch(batchState);

		return response.json({
			message: 'Legacy data imported successfully',
			householdId,
			counts: {
				members: ownersSnapshot.size,
				categories: categoriesSnapshot.size,
				transactions: paymentsSnapshot.size
			}
		});
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: err.code || 'Failed to import legacy data' });
	}
};

exports.getMembers = async (request, response) => {
	if (!request.user.householdId) {
		return response.status(400).json({ needsHouseholdSetup: true, error: 'Household setup required' });
	}

	try {
		const snapshot = await db
			.collection('households')
			.doc(request.user.householdId)
			.collection('members')
			.orderBy('createdAt', 'asc')
			.get();

		const members = [];
		snapshot.forEach((doc) => {
			const data = doc.data();
			members.push({
				memberId: doc.id,
				ownerId: doc.id,
				ownerName: getMemberName(data),
				...data
			});
		});

		return response.json(members);
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: err.code || 'Failed to fetch members' });
	}
};

exports.postMember = async (request, response) => {
	const householdId = requireHouseholdOwner(request, response);
	if (!householdId) return;

	const firstName = String(request.body.firstName || '').trim();
	const lastName = String(request.body.lastName || '').trim();
	const email = normalizeEmail(request.body.email);
	const phoneNumber = String(request.body.phoneNumber || '').trim();

	if (firstName === '') {
		return response.status(400).json({ firstName: 'Must not be empty' });
	}
	if (email === '') {
		return response.status(400).json({ email: 'Must not be empty' });
	}
	if (!isEmail(email)) {
		return response.status(400).json({ email: 'Must be valid email address' });
	}
	if (!isPhoneNumber(phoneNumber)) {
		return response.status(400).json({ phoneNumber: 'Must be a valid phone number' });
	}

	try {
		const memberRef = db.collection('households').doc(householdId).collection('members').doc();
		const householdName = await getHouseholdName(householdId);
		const newMember = {
			firstName,
			lastName,
			email,
			phoneNumber,
			role: 'member',
			active: true,
			createdAt: new Date().toISOString(),
			...buildInviteFields()
		};

		await memberRef.set(newMember);
		const invitePayload = await deliverInvite(request, newMember, householdName);
		return response.status(201).json({
			memberId: memberRef.id,
			ownerId: memberRef.id,
			ownerName: getMemberName(newMember),
			...newMember,
			...invitePayload
		});
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: err.code || 'Failed to create member' });
	}
};

exports.editMember = async (request, response) => {
	const householdId = requireHouseholdOwner(request, response);
	if (!householdId) return;

	const editableMember = {};
	['firstName', 'lastName', 'email', 'phoneNumber'].forEach((field) => {
		if (request.body[field] !== undefined) {
			editableMember[field] = field === 'email'
				? normalizeEmail(request.body[field])
				: String(request.body[field]).trim();
		}
	});

	if (request.body.active !== undefined) {
		editableMember.active = Boolean(request.body.active);
	}

	if (request.body.role !== undefined) {
		const role = String(request.body.role);
		if (!['owner', 'member'].includes(role)) {
			return response.status(400).json({ role: 'Invalid role' });
		}
		editableMember.role = role;
	}

	if (editableMember.firstName !== undefined && editableMember.firstName === '') {
		return response.status(400).json({ firstName: 'Must not be empty' });
	}
	if (editableMember.email !== undefined && !isEmail(editableMember.email)) {
		return response.status(400).json({ email: 'Must be valid email address' });
	}
	if (editableMember.phoneNumber !== undefined && !isPhoneNumber(editableMember.phoneNumber)) {
		return response.status(400).json({ phoneNumber: 'Must be a valid phone number' });
	}

	if (Object.keys(editableMember).length === 0) {
		return response.status(400).json({ error: 'No editable fields provided' });
	}

	try {
		const memberRef = db.collection('households').doc(householdId).collection('members').doc(request.params.memberId);
		const memberDoc = await memberRef.get();
		if (!memberDoc.exists) {
			return response.status(404).json({ error: 'Member not found' });
		}

		await memberRef.update(editableMember);
		const updatedDoc = await memberRef.get();
		const updatedData = updatedDoc.data();

		if (updatedData.username) {
			await db.collection('users').doc(updatedData.username).update({
				role: updatedData.role || 'member',
				memberId: updatedDoc.id,
				householdId
			});
		}

		return response.json({
			message: 'Updated successfully',
			memberId: updatedDoc.id,
			ownerId: updatedDoc.id,
			ownerName: getMemberName(updatedData),
			...updatedData
		});
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: err.code || 'Failed to update member' });
	}
};

exports.sendMemberInvite = async (request, response) => {
	const householdId = requireHouseholdOwner(request, response);
	if (!householdId) return;

	try {
		const memberRef = db.collection('households').doc(householdId).collection('members').doc(request.params.memberId);
		const memberDoc = await memberRef.get();
		if (!memberDoc.exists) {
			return response.status(404).json({ error: 'Member not found' });
		}

		const memberData = memberDoc.data();
		if (memberData.userId) {
			return response.status(400).json({ error: 'Member is already registered' });
		}
		if (!isEmail(memberData.email)) {
			return response.status(400).json({ email: 'Add a valid member email before sending an invite' });
		}

		const inviteFields = buildInviteFields();
		const updatedMember = {
			...memberData,
			...inviteFields
		};
		await memberRef.update(inviteFields);
		const householdName = await getHouseholdName(householdId);
		const invitePayload = await deliverInvite(request, updatedMember, householdName);

		return response.json({
			message: invitePayload.emailSent ? 'Invite email sent' : invitePayload.emailQueued ? 'Invite email queued' : 'Invite ready',
			memberId: memberDoc.id,
			...invitePayload
		});
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: err.code || 'Failed to create invite' });
	}
};

exports.acceptMemberInvite = async (request, response) => {
	const inviteToken = String(request.body.inviteToken || '').trim();
	if (!inviteToken) {
		return response.status(400).json({ inviteToken: 'Invite token is required' });
	}

	if (request.user.householdId) {
		return response.status(400).json({ error: 'User already belongs to a household' });
	}

	try {
		const invite = await findInviteByToken(inviteToken);
		if (!invite) {
			return response.status(400).json({ inviteToken: 'Invalid or expired invite link' });
		}

		const memberDoc = invite.memberDoc;
		const memberData = invite.memberData;
		const householdRef = invite.householdRef;

		if (memberData.active === false) {
			return response.status(400).json({ inviteToken: 'This member invite is inactive' });
		}
		if (memberData.userId) {
			return response.status(400).json({ inviteToken: 'This invite has already been used' });
		}
		if (memberData.email && normalizeEmail(memberData.email) !== normalizeEmail(request.user.email)) {
			return response.status(400).json({ email: 'Invite email does not match your signed-in account' });
		}

		const userRef = db.collection('users').doc(request.user.username);
		const userDoc = await userRef.get();
		if (!userDoc.exists) {
			return response.status(404).json({ error: 'User profile not found' });
		}

		const userData = userDoc.data();
		const now = new Date().toISOString();
		const batch = db.batch();
		batch.update(memberDoc.ref, {
			userId: request.user.uid,
			username: request.user.username,
			firstName: userData.firstName || memberData.firstName || '',
			lastName: userData.lastName || memberData.lastName || '',
			email: normalizeEmail(userData.email || memberData.email || request.user.email),
			phoneNumber: userData.phoneNumber || memberData.phoneNumber || '',
			role: 'member',
			active: true,
			inviteStatus: 'accepted',
			inviteAcceptedAt: now,
			updatedAt: now
		});
		batch.update(userRef, {
			householdId: householdRef.id,
			memberId: memberDoc.id,
			role: 'member',
			active: true,
			updatedAt: now
		});

		await batch.commit();

		const householdDoc = await householdRef.get();
		return response.json({
			message: 'Household invite accepted',
			householdId: householdRef.id,
			householdName: householdDoc.exists ? householdDoc.data().name : '',
			memberId: memberDoc.id,
			role: 'member'
		});
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: err.code || 'Failed to accept invite' });
	}
};

exports.deleteMember = async (request, response) => {
	const householdId = requireHouseholdOwner(request, response);
	if (!householdId) return;

	if (request.params.memberId === request.user.memberId) {
		return response.status(400).json({ error: 'Main householder cannot delete their own member record' });
	}

	try {
		const memberRef = db.collection('households').doc(householdId).collection('members').doc(request.params.memberId);
		const memberDoc = await memberRef.get();
		if (!memberDoc.exists) {
			return response.status(404).json({ error: 'Member not found' });
		}

		const memberData = memberDoc.data();
		await memberRef.delete();

		if (memberData.username) {
			await db.collection('users').doc(memberData.username).update({
				householdId: null,
				memberId: null,
				role: null
			});
		}

		return response.json({ message: 'Delete successful' });
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: err.code || 'Failed to delete member' });
	}
};
