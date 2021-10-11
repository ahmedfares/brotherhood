const { db } = require('../util/admin');

exports.postOnePayment = (request, response) => {
	
	if (request.body.Description.trim() === '') {
		return response.status(400).json({ Description: 'Must not be empty' });
    }
    
    
    const newPaymentItem = {
        Amount: request.body.Amount,
        Category: request.body.Category,
        Description: request.body.Description,
        TransactionBy: request.body.TransactionBy,
        TransactionDate: new Date().toISOString()
    }
    db
        .collection('payments')
        .add(newPaymentItem)
        .then((doc)=>{
            const responsePaymentItem = newPaymentItem;
            responsePaymentItem.id = doc.id;
            return response.json(responsePaymentItem);
        })
        .catch((err) => {
			response.status(500).json({ error: 'Something went wrong' });
			console.error(err);
		});
};

exports.editPayment = ( request, response ) => { 
    if(request.body.paymentId || request.body.createdAt){
        response.status(403).json({message: 'Not allowed to edit'});
    }
    let document = db.collection('payments').doc(`${request.params.paymentId}`);
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

exports.deletePayment = (request, response) => {
    const document = db.collection('payments').doc(`${request.params.paymentId}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Payment not found' })
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

exports.getAllPayments = (request, response) => {
	db
		.collection('payments')
        .orderBy('TransactionDate', 'desc')
		.get()
		.then((data) => {
			let payments = [];
			data.forEach((doc) => {
				payments.push({
                    paymentId: doc.id,
                    Amount: doc.data().Amount,
					Category: doc.data().Category,
					TransactionDate: doc.data().TransactionDate,
					TransactionBy: doc.data().TransactionBy,
					Description: doc.data().Description,
				});
			});
			return response.json(payments);
		})
		.catch((err) => {
			console.error(err);
			return response.status(500).json({ error: err.code});
		});
};