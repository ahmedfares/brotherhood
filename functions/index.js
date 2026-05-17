const functions = require('firebase-functions');
const app = require('express')();
const auth = require('./util/auth');

const cors = require('cors');
const allowedOrigins = [
    'https://brotherhood-edc8d.web.app',
    'https://brotherhood-p.xyz',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error('Not allowed by CORS'));
    }
}));


const {
    getAllTodos,
    postOneTodo,
	deleteTodo,
    editTodo
} = require('./APIs/todos');

// Todos
app.get('/todos', auth, getAllTodos);
//app.get('/todo/:todoId', auth, getOneTodo);
app.post('/todo',auth, postOneTodo);
app.delete('/todo/:todoId',auth, deleteTodo);
app.put('/todo/:todoId',auth, editTodo);


const {
    getAllPayments,
    getPaymentsMetadata,
    postOnePayment,
    deletePayment,
    editPayment
} = require('./APIs/payments');

// Payments
app.get('/payments', auth, getAllPayments);
app.get('/payments/metadata', auth, getPaymentsMetadata);
app.post('/payment',auth, postOnePayment);
app.delete('/payment/:paymentId',auth, deletePayment);
app.put('/payment/:paymentId',auth, editPayment);

const {
    getOwners,
    getCollections,
    postCollection,
    editCollection,
    deleteCollection
} = require('./APIs/ref');

// Reference data
app.get('/owners', auth, getOwners);
app.get('/collections', auth, getCollections);
app.post('/collection', auth, postCollection);
app.put('/collection/:collectionId', auth, editCollection);
app.delete('/collection/:collectionId', auth, deleteCollection);

const {
    getHousehold,
    createHousehold,
    updateHousehold,
    importLegacyHouseholdData,
    getMembers,
    postMember,
    editMember,
    deleteMember,
    sendMemberInvite,
    acceptMemberInvite
} = require('./APIs/households');

// Households and members
app.get('/household', auth, getHousehold);
app.post('/household', auth, createHousehold);
app.put('/household', auth, updateHousehold);
app.post('/household/import-legacy', auth, importLegacyHouseholdData);
app.get('/members', auth, getMembers);
app.post('/member', auth, postMember);
app.post('/member/:memberId/invite', auth, sendMemberInvite);
app.post('/member/invite/accept', auth, acceptMemberInvite);
app.put('/member/:memberId', auth, editMember);
app.delete('/member/:memberId', auth, deleteMember);

const {
    loginUser,
    signUpUser,
    uploadProfilePhoto,
    getUserDetail,
    updateUserDetails
} = require('./APIs/users');

// Users
app.post('/login', loginUser);
app.post('/signup', signUpUser);
app.post('/user/image', auth, uploadProfilePhoto);
app.get('/user', auth, getUserDetail);
app.put('/user', auth, updateUserDetails);

exports.api = functions.https.onRequest(app);
