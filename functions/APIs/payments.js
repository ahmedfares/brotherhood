const { db } = require('../util/admin');

exports.postOnePayment = (request, response) => {
	
	if (request.body.Description.trim() === '') {
		return response.status(400).json({ Description: 'Must not be empty' });
    }
    
    
    const newPaymentItem = {
        Amount: Number(request.body.Amount),
        Category: String(request.body.Category),
        Description: request.body.Description,
        TransactionBy: String(request.body.TransactionBy),
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

exports.editPayment = async (request, response) => { 
    if (request.body.paymentId || request.body.createdAt || request.body.TransactionDate) {
        return response.status(403).json({ message: 'Not allowed to edit protected fields' });
    }

    const editablePayment = {};

    if (request.body.Description !== undefined) {
        if (String(request.body.Description).trim() === '') {
            return response.status(400).json({ Description: 'Must not be empty' });
        }
        editablePayment.Description = String(request.body.Description).trim();
    }

    if (request.body.Amount !== undefined) {
        const amount = Number(request.body.Amount);
        if (!Number.isFinite(amount)) {
            return response.status(400).json({ Amount: 'Must be a valid number' });
        }
        editablePayment.Amount = amount;
    }

    if (request.body.Category !== undefined) {
        if (String(request.body.Category).trim() === '') {
            return response.status(400).json({ Category: 'Must not be empty' });
        }
        editablePayment.Category = String(request.body.Category);
    }

    if (request.body.TransactionBy !== undefined) {
        if (String(request.body.TransactionBy).trim() === '') {
            return response.status(400).json({ TransactionBy: 'Must not be empty' });
        }
        editablePayment.TransactionBy = String(request.body.TransactionBy);
    }

    if (Object.keys(editablePayment).length === 0) {
        return response.status(400).json({ error: 'No editable fields provided' });
    }

    const document = db.collection('payments').doc(`${request.params.paymentId}`);

    try {
        const doc = await document.get();
        if (!doc.exists) {
            return response.status(404).json({ error: 'Payment not found' });
        }

        await document.update(editablePayment);
        return response.json({
            message: 'Updated successfully',
            paymentId: request.params.paymentId,
            data: editablePayment
        });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ 
            error: err.code || 'Failed to update payment'
        });
    }
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

exports.getAllPayments = async (request, response) => {
	try {
		const page = parseInt(request.query.page) || 1;
		const limit = parseInt(request.query.limit) || 10;
		const year = request.query.year;
		const month = request.query.month;
		const category = request.query.category;
		const offset = (page - 1) * limit;

		let query = db.collection('payments');

		// Apply Date Filtering
		if (year && year !== 'All') {
			const startYear = `${year}-01-01T00:00:00.000Z`;
			const endYear = `${year}-12-31T23:59:59.999Z`;
			
			if (month && month !== 'All') {
				const m = parseInt(month) + 1;
				const startMonth = `${year}-${m.toString().padStart(2, '0')}-01T00:00:00.000Z`;
				
				// Calculate end of month
				let nextM = m + 1;
				let nextY = parseInt(year);
				if (nextM > 12) {
					nextM = 1;
					nextY += 1;
				}
				const endMonth = `${nextY}-${nextM.toString().padStart(2, '0')}-01T00:00:00.000Z`;
				query = query.where('TransactionDate', '>=', startMonth).where('TransactionDate', '<', endMonth);
			} else {
				query = query.where('TransactionDate', '>=', startYear).where('TransactionDate', '<=', endYear);
			}
		}

		// Apply Category Filtering
		if (category && category !== 'All') {
			const categoryValue = String(category);
			const numericCategory = Number(categoryValue);
			const categoryValues = Number.isNaN(numericCategory)
				? [categoryValue]
				: [categoryValue, numericCategory];
			query = query.where('Category', 'in', categoryValues);
		}


		// Fetch one extra row to determine whether another page exists without
		// running an additional count query.
		const dataSnapshot = await query
			.orderBy('TransactionDate', 'desc')
			.limit(limit + 1)
			.offset(offset)
			.get();

		let payments = [];
		const docs = dataSnapshot.docs.slice(0, limit);
		docs.forEach((doc) => {
			payments.push({
				paymentId: doc.id,
				Amount: doc.data().Amount,
				Category: doc.data().Category,
				TransactionDate: doc.data().TransactionDate,
				TransactionBy: doc.data().TransactionBy,
				Description: doc.data().Description,
			});
		});

		return response.json({
			status: 'success',
			data: payments,
			pagination: {
				page: page,
				limit: limit,
				hasMore: dataSnapshot.size > limit
			}
		});
	} catch (err) {
		console.error(err);
		return response.status(500).json({ error: 'Failed to fetch payments', details: err.code });
	}
};

exports.getPaymentsMetadata = async (request, response) => {
    try {
        const snapshot = await db.collection('payments').select('TransactionDate').get();
        const years = new Set();
        snapshot.forEach(doc => {
            const date = doc.data().TransactionDate;
            if (date) {
                years.add(new Date(date).getFullYear());
            }
        });
        
        // Ensure current year is always there
        years.add(new Date().getFullYear());
        
        return response.json({
            years: Array.from(years).sort((a, b) => b - a)
        });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: 'Failed to fetch metadata' });
    }
};
