const functions = require('firebase-functions');
const app = require('express')();
const auth = require('./util/auth');

const cors = require('cors');
app.use(cors({
    origin: ['https://brotherhood-edc8d.web.app', 'https://brotherhood-p.xyz']
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
    postOnePayment,
	deletePayment,
    editPayment
} = require('./APIs/payments');

// Payments
app.get('/payments', auth, getAllPayments);
app.post('/payment',auth, postOnePayment);
app.delete('/payment/:paymentId',auth, deletePayment);
app.put('/payment/:paymentId',auth, editPayment);

const {
    getOwners,
    getCollections
} = require('./APIs/ref');

// Payments
app.get('/owners', auth, getOwners);
app.get('/collections', auth, getCollections);

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