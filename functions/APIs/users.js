const { admin, db } = require('../util/admin');
const config = require('../util/config');

const firebase = require('firebase');

firebase.initializeApp(config);

if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    firebase.auth().useEmulator(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
}


const { validateLoginData, validateSignUpData } = require('../util/validators');
const { seedDefaultCategories } = require('../util/households');
const { attachUserToPendingInvite, findInviteByToken } = require('./households');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const APP_FALLBACK_ORIGIN = 'https://brotherhood-edc8d.web.app';

const getAppOrigin = (request) => {
    const origin = request.get('origin');
    const allowedOrigins = [
        'https://brotherhood-edc8d.web.app',
        'https://brotherhood-p.xyz',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001'
    ];

    return allowedOrigins.includes(origin) ? origin : APP_FALLBACK_ORIGIN;
};

const getEmailVerificationSettings = (request) => ({
    url: `${getAppOrigin(request)}/login?verified=1`,
    handleCodeInApp: false
});

// Login
exports.loginUser = async (request, response) => {
    const user = {
        email: normalizeEmail(request.body.email),
        password: request.body.password
    };

    const { valid, errors } = validateLoginData(user);
	if (!valid) return response.status(400).json(errors);

    try {
        const data = await firebase.auth().signInWithEmailAndPassword(user.email, user.password);
        const authUser = data.user;

        if (!authUser.emailVerified) {
            await authUser.sendEmailVerification(getEmailVerificationSettings(request)).catch((err) => {
                console.error('Unable to resend verification email', err);
            });
            return response.status(403).json({
                emailVerification: 'Please verify your email address before signing in. We sent you a new verification email.'
            });
        }

        const snapshot = await db.collection('users').where('userId', '==', authUser.uid).limit(1).get();
        if (snapshot.empty) {
            return response.status(403).json({ general: 'User profile not found' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        await attachUserToPendingInvite({
            userRef: userDoc.ref,
            userData,
            uid: authUser.uid,
            email: authUser.email
        });

        await userDoc.ref.update({
            active: true,
            emailVerified: true,
            lastLoginAt: new Date().toISOString()
        });

        const token = await authUser.getIdToken();
        return response.json({ token });
    } catch (error) {
        console.error(error);
        return response.status(403).json({ general: 'wrong credentials, please try again'});
    }
};

exports.signUpUser = async (request, response) => {
    const newUser = {
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: normalizeEmail(request.body.email),
        phoneNumber: request.body.phoneNumber,
		password: request.body.password,
		confirmPassword: request.body.confirmPassword,
		username: request.body.username,
		householdName: request.body.householdName,
        inviteToken: String(request.body.inviteToken || '').trim()
    };

    const validationUser = { ...newUser };
    if (newUser.inviteToken) {
        delete validationUser.householdName;
    }

    const { valid, errors } = validateSignUpData(validationUser);

	if (!valid) return response.status(400).json(errors);

    let authUser;
    try {
        const userDoc = await db.doc(`/users/${newUser.username}`).get();
        if (userDoc.exists) {
            return response.status(400).json({ username: 'this username is already taken' });
        }

        let invite = null;
        if (newUser.inviteToken) {
            invite = await findInviteByToken(newUser.inviteToken);
            if (!invite) {
                return response.status(400).json({ inviteToken: 'Invalid or expired invite link' });
            }

            const memberData = invite.memberDoc.data();
            if (memberData.active === false) {
                return response.status(400).json({ inviteToken: 'This member invite is inactive' });
            }
            if (memberData.userId) {
                return response.status(400).json({ inviteToken: 'This invite has already been used' });
            }
            if (memberData.email && normalizeEmail(memberData.email) !== newUser.email) {
                return response.status(400).json({ email: 'Email must match the invited member email' });
            }
        }

        const data = await firebase
            .auth()
            .createUserWithEmailAndPassword(newUser.email, newUser.password);

        authUser = data.user;
        await authUser.sendEmailVerification(getEmailVerificationSettings(request));

        const now = new Date().toISOString();
        const householdRef = invite ? invite.householdRef : db.collection('households').doc();
        const memberRef = invite ? invite.memberDoc.ref : householdRef.collection('members').doc(newUser.username);
        const role = invite ? 'member' : 'owner';
        const batch = db.batch();

        const userCredentials = {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            username: newUser.username,
            phoneNumber: newUser.phoneNumber,
            email: newUser.email,
            createdAt: now,
            userId: authUser.uid,
            householdId: householdRef.id,
            memberId: memberRef.id,
            role,
            active: false,
            emailVerified: false
        };

        if (!invite) {
            batch.set(householdRef, {
                name: newUser.householdName || `${newUser.firstName}'s Household`,
                createdBy: newUser.username,
                createdAt: now,
                updatedAt: now
            });
            seedDefaultCategories(batch, householdRef);
        }

        batch.set(memberRef, {
            userId: authUser.uid,
            username: newUser.username,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            phoneNumber: newUser.phoneNumber,
            role,
            active: true,
            inviteStatus: invite ? 'accepted' : null,
            inviteAcceptedAt: invite ? now : null,
            createdAt: invite ? (invite.memberDoc.data().createdAt || now) : now,
            updatedAt: now
        }, { merge: true });

        batch.set(db.doc(`/users/${newUser.username}`), userCredentials);
        await batch.commit();

        return response.status(201).json({
            message: 'Account created. Please verify your email address before signing in.',
            emailVerificationRequired: true
        });
    } catch (err) {
		console.error(err);
        if (authUser) {
            admin.auth().deleteUser(authUser.uid).catch((deleteError) => {
                console.error('Failed to clean up auth user after signup error', deleteError);
            });
        }
		if (err.code === 'auth/email-already-in-use') {
			return response.status(400).json({ email: 'Email already in use' });
		}
        return response.status(500).json({ general: 'Something went wrong, please try again' });
	}
}

deleteImage = (imageName) => {
    const bucket = admin.storage().bucket();
    const path = `${imageName}`
    return bucket.file(path).delete()
    .then(() => {
        return
    })
    .catch((error) => {
        return
    })
}

// Upload profile picture
exports.uploadProfilePhoto = (request, response) => {
    const BusBoy = require('busboy');
	const path = require('path');
	const os = require('os');
	const fs = require('fs');
	const busboy = new BusBoy({ headers: request.headers });

	let imageFileName;
	let imageToBeUploaded = {};

	busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
		if (mimetype !== 'image/png' && mimetype !== 'image/jpeg') {
			return response.status(400).json({ error: 'Wrong file type submited' });
		}
		const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${request.user.username}.${imageExtension}`;
		const filePath = path.join(os.tmpdir(), imageFileName);
		imageToBeUploaded = { filePath, mimetype };
		file.pipe(fs.createWriteStream(filePath));
    });
    deleteImage(imageFileName);
	busboy.on('finish', () => {
		admin
			.storage()
			.bucket()
			.upload(imageToBeUploaded.filePath, {
				resumable: false,
				metadata: {
					metadata: {
						contentType: imageToBeUploaded.mimetype
					}
				}
			})
			.then(() => {
				const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
				return db.doc(`/users/${request.user.username}`).update({
					imageUrl
				});
			})
			.then(() => {
				return response.json({ message: 'Image uploaded successfully' });
			})
			.catch((error) => {
				console.error(error);
				return response.status(500).json({ error: error.code });
			});
	});
	busboy.end(request.rawBody);
};

exports.getUserDetail = (request, response) => {
    let userData = {};
	db
		.doc(`/users/${request.user.username}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
                userData.userCredentials = doc.data();
                return response.json(userData);
			}	
		})
		.catch((error) => {
			console.error(error);
			return response.status(500).json({ error: error.code });
		});
}

exports.updateUserDetails = (request, response) => {
    let document = db.collection('users').doc(`${request.user.username}`);
    const editableUser = {};
    ['firstName', 'lastName', 'country'].forEach((field) => {
        if (request.body[field] !== undefined) {
            editableUser[field] = String(request.body[field]).trim();
        }
    });
    document.update(editableUser)
    .then(()=> {
        response.json({message: 'Updated successfully'});
    })
    .catch((error) => {
        console.error(error);
        return response.status(500).json({ 
            message: "Cannot Update the value"
        });
    });
}
