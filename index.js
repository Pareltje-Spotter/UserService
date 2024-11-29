const express = require('express')
const cors = require('cors');
const pool = require('./db.js');
const amqplib = require('amqplib')
// new

const app = express()
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 5003;
var connection = null;
var channel = null;


const getById = async (id) => {
    try {
        const result = await pool.query('SELECT * FROM userinfo WHERE id = $1', [id]);
        if (result.rows.length !== 0) {
            console.log(result.rows[0]) // Handle not found
            return result.rows[0];
        }

    } catch (error) {
        console.log("error: " + error)
        return null;
        // res.status(500).json({ error: 'Failed to fetch data' });
    }

}

async function messageConsumer() {
    connection = await amqplib.connect('amqp://rabbitmq:rabbitmq@rabbitmq')
    // connection = await amqplib.connect('amqp://rabbitmq:rabbitmq@localhost')
    channel = await connection.createChannel()

    var queue = 'userQueue';

    channel.assertQueue(queue, {
        durable: false
    });

    channel.prefetch(1);
    // console.log(' [x] Awaiting RPC requests');
    channel.consume(queue, async function reply(msg) {

        console.log(`received: ${msg.content.toString()}`);
 
        const delivery = await getById(parseInt(msg.content));
        
        // Check if document exists
        if (delivery == null) {
            responseMessage = { error: 'Car not found' };
        } else {
            console.log(delivery)
            responseMessage = delivery;
        }

        await channel.sendToQueue(msg.properties.replyTo,
            Buffer.from(JSON.stringify(responseMessage)), {
            correlationId: msg.properties.correlationId
        });

        console.log(`Sent: ${JSON.stringify(responseMessage)}`);

        channel.ack(msg);
    });
}
messageConsumer();


//////////////////////////

const users = [{ id: 1, name: "John" }, { id: 2, name: "Brian" }]

app.get('/users', async (req, res) => {
    return res.send(users)
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