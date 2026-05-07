const { db } = require('../util/admin');

exports.postOneTodo = (request, response) => {
	
	if (request.body.body.trim() === '') {
		return response.status(400).json({ body: 'Must not be empty' });
    }
    
    if(request.body.title.trim() === '') {
        return response.status(400).json({ title: 'Must not be empty' });
    }
    
    const newTodoItem = {
        title: request.body.title,
        body: request.body.body,
        username: request.user.username,
        createdAt: new Date().toISOString()
    }
    db
        .collection('todos')
        .add(newTodoItem)
        .then((doc)=>{
            const responseTodoItem = newTodoItem;
            responseTodoItem.id = doc.id;
            return response.json(responseTodoItem);
        })
        .catch((err) => {
			response.status(500).json({ error: 'Something went wrong' });
			console.error(err);
		});
};

exports.editTodo = ( request, response ) => { 
    if(request.body.todoId || request.body.createdAt){
        response.status(403).json({message: 'Not allowed to edit'});
    }
    let document = db.collection('todos').doc(`${request.params.todoId}`);
    document.update(request.body)
    .then(()=> {
        response.json({message: 'Updated successfully'});
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ 
                error: err.code 
        });
    });
};

exports.deleteTodo = (request, response) => {
    const document = db.doc(`/todos/${request.params.todoId}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Todo not found' })
            }
            if(doc.data().username !== request.user.username) {
                return response.status(403).json({error:"UnAuthorized"})
            }
            return document.delete();
        })
        .then(() => {
            response.json({ message: 'Delete successfull' });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};

exports.getAllTodos = async (request, response) => {
	try {
		const page = parseInt(request.query.page) || 1;
		const limit = parseInt(request.query.limit) || 10;
		const offset = (page - 1) * limit;

		let query = db.collection('todos').where('username', '==', request.user.username);

		const fullDataSnapshot = await query.get();
		const total = fullDataSnapshot.size;

		const dataSnapshot = await query
			.orderBy('createdAt', 'desc')
			.limit(limit)
			.offset(offset)
			.get();

		let todos = [];
		dataSnapshot.forEach((doc) => {
			todos.push({
				todoId: doc.id,
				title: doc.data().title,
				body: doc.data().body,
				createdAt: doc.data().createdAt,
			});
		});

		return response.json({
			status: 'success',
			data: todos,
			pagination: {
				total: total,
				page: page,
				limit: limit,
				totalPages: Math.ceil(total / limit)
			}
		});
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: 'Failed to fetch todos', details: err.code });
	}
};