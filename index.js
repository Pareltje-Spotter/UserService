const express = require('express')
const cors = require('cors');
// new
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectId;

const app = express()
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 3001;
var connection = null;
var channel = null;

// new
const uri = "mongodb://mongoadmin:mongoadmin@localhost:27017"; // Replace with your MongoDB connection string
const client = new MongoClient(uri,);

//new
async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB successfully!');
        return client.db('userInfo'); // Replace with your database name
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}
// new
app.get('/data', async (req, res) => {
    try {
        const db = await connectToMongoDB();
        const collection = db.collection('users'); // Replace with your collection name

        // Perform database operations, e.g., find documents
        const data = await collection.find().toArray();

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});
// new
app.get('/data/:id', async (req, res) => {
    try {
        const db = await connectToMongoDB();
        const collection = db.collection('users'); // Replace with your collection name

        const id = req.params.id; // Get the ID from the request parameters
        // Find the document by ID
        const data = await collection.findOne({ _id: new ObjectID(id) });

        if (data) {
            res.json(data);
        } else {
            res.status(404).json({ error: 'Document not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.post('/create', async (req, res) => {
    try {
        const db = await connectToMongoDB();
        const collection = db.collection('users')

        const newData = {
            name: req.body.name,
            email: req.body.email,
        };
        const result = await collection.insertOne(newData);

        res.status(201).json({ message: 'Document created successfully', data: result.insertedId });
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ error: 'Failed to create document' });
    }
});

app.put('/update/:id', async (req, res) => {
    try {
        const db = await connectToMongoDB();
        const collection = db.collection('users')

        const id = req.params.id;
        const updatedData = req.body;

        const result = await collection.updateOne({ _id: new ObjectID(id) }, { $set: updatedData });

        if (result.modifiedCount === 0) {
            res.status(404).json({ error: 'Document not found' });
        } else {
            res.json({ message: 'Document updated successfully' });
        }
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({
            error: 'Failed to update document'
        });
    }
});

app.delete('/delete/:id', async (req, res) => {
    try {
        const db = await connectToMongoDB();
        const collection = db.collection('users')

        const id = req.params.id;

        // Delete the document
        const result = await collection.deleteOne({ _id: new ObjectID(id) });

        if (result.deletedCount === 0) {
            res.status(404).json({ error: 'Document not found' });
        } else {
            res.json({ message: 'Document deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({
            error: 'Failed to delete document'
        });
    }
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});