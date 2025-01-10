const express = require('express')
const cors = require('cors');
const pool = require('./db.js');
const amqplib = require('amqplib')
require('dotenv').config(); // Load .env file


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



const QUEUE_NAME = 'user-deletion';

// Initialize RabbitMQ connection
async function initRabbitMQ() {
    try {
        const connection = await amqplib.connect('amqp://rabbitmq:rabbitmq@rabbitmq');
        channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        console.log('RabbitMQ connected and queue asserted:', QUEUE_NAME);
    } catch (error) {
        console.error('Failed to initialize RabbitMQ:', error);
        process.exit(1);
    }
}

// Function to send a message to the RabbitMQ queue

async function sendUserDeletionMessage(userId) {
    try {
        const message = JSON.stringify({ userId });
        channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true });
        console.log('Sent message to RabbitMQ:', message);
    } catch (error) {
        console.error('Failed to send message to RabbitMQ:', error);
    }
}



// Initialize RabbitMQ and start the server
// const PORT = 3000;
// app.listen(PORT, async () => {
//     console.log(`Server is running on port ${PORT}`);
//     await initRabbitMQ();
// });


async function messageConsumer() {
    connection = await amqplib.connect(`amqp://${process.env.RABBIT_USERNAME}:${process.env.RABBIT_PASSWORD}@${process.env.RABBIT_HOST || 'rabbitmq'}`)
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
        await pool.query('CREATE TABLE userinfo(id SERIAL PRIMARY KEY, name VARCHAR(100), uuid VARCHAR(100), role VARCHAR(100))')
        res.status(200).send({ message: "Successfully created table" })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
})

app.post('/userinfo/create', async (req, res) => {
    const { name, uuid, role } = req.body;
    try {
        const result = await pool.query('INSERT INTO userinfo (name, uuid, role) VALUES ($1, $2, $3) RETURNING *', [name, uuid, role]);
        res.status(200).send({ message: "Successfully created child", user: result.rows[0] });
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

app.get('/userinfo/user/:id', async (req, res) => {
    const { id } = req.params;
    const { name, uuid } = req.body;

    try {
        const result = await pool.query('SELECT * FROM userinfo WHERE uuid = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' }); // Handle not found
        }
        else {
            res.status(200).json(result.rows);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }


});

const roleCheck = async (id) => {
    try {
        console.log(id)
        const result = await pool.query('SELECT role FROM userinfo WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return false;
        }
        if (result.rows[0].role === 'admin') {
            return true;
        } else {
            return false;
        }

    } catch (error) {
        console.error('Error checking role:', error);
        return false;
    }
}

app.put('/userinfo/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, uuid, role, requestId } = req.body;

        // Validate input
        if (!name || !uuid) {
            res.status(400).json({ error: 'Name and uuid are required' });
        }
        if (roleCheck(requestId) == true) {
            try {
                const result = await pool.query(
                    'UPDATE userinfo SET name = $1, uuid = $2, role = $3 WHERE id = $4 RETURNING *',
                    [name, uuid, role, id]
                );

                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }

                res.json(result.rows[0]);

            } catch (err) {
                console.error(err.message);
                res.status(500).send('Server error');
            }
        }
        else{
            res.status(500).json({ error: 'user not authorized to do this action' });
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

        await sendUserDeletionMessage(id);

        // Return a success message along with the deleted user data
        res.json({ message: 'User deleted successfully', user: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});



app.listen(port, async () => {
    console.log(`Server listening on port ${port}`);
    await initRabbitMQ();
});