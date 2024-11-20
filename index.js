const express = require('express')
const cors = require('cors');
const pool = require('./db.js');
// new
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectId;

const app = express()
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 5003;
var connection = null;
var channel = null;

// new
const uri = "mongodb://mongoadmin:mongoadmin@mongo:27017"; // Replace with your MongoDB connection string
const client = new MongoClient(uri,);

//////////////////////////

const users = [{ id: 1, name: "John" }, { id: 2, name: "Brian" }]

app.get('/users', async (req, res) => {
    res.send(users)
})

//////////////////////////

app.get('/setup', async (req, res) => {
    try {
        await pool.query('CREATE TABLE userinfo(id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100))')
        res.status(200).send({ message: "Successfully created table" })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
})

app.post('/userinfo/create', async (req, res) => {
    const { name, email } = req.body;
    try {
        await pool.query('INSERT INTO userinfo (name, email) VALUES ($1, $2)', [name, email]);
        res.status(200).send({ message: "Successfully created child" })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
})

app.get('/userinfo', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM userinfo');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// new
app.get('/userinfo/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM userinfo WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' }); // Handle not found
        }
        else {
            res.json(result.rows);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});


app.put('/userinfo/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        // Validate input
        if (!name || !email) {
            res.status(400).json({ error: 'Name and email are required' });
        }

        try {
            const result = await pool.query(
                'UPDATE userinfo SET name = $1, email = $2 WHERE id = $3 RETURNING *',
                [name, email, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(result.rows[0]);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.delete('/userinfo/delete/:id', async (req, res) => {
    const { id } = req.params; // Extract the id from the route parameter
    try {
        // Delete the user from the database
        const result = await pool.query('DELETE FROM userinfo WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            // If no user is found with that id
            return res.status(404).json({ error: 'User not found' });
        }

        // Return a success message along with the deleted user data
        res.json({ message: 'User deleted successfully', user: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});



app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});