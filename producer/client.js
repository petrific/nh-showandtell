#!/usr/bin/env node
var express = require("express");
var http = require('http');
var amqp = require('amqplib/callback_api');
var mongodb = require('mongodb');
var myParser = require("body-parser");
var app = express();
var args = process.argv.slice(2);
var employee;


var Mango = {
    connect: function() {
        var connectionString = process.env.MONGO_CONNECTION || 'mongodb://localhost:27017';
        var self = this;
        if(!this.connection) {
            this.connection = mongodb.connect(connectionString, {useUnifiedTopology: true})
                .then(function(client) {
                    self.collection = mongoCollection = client.db('newhire').collection('employee');
                    console.log('connected to mongo');
                }).catch(err => { console.error(err); throw err; });
        }
        return this.connection;
    },
    Drop: function() {
        return this.connect().then(x => {
            this.collection.drop();
        })
        .catch(console.error);
    },
    Save: function(doc) {
        return this.connect().then(x => {
            return this.collection.insertOne(doc);
        })
    },
    Update: function(update) {
        return this.connect().then(x => {
            return this.collection.updateOne({_id: 1}, update).catch(err => { console.log(err); throw err; });
        });
    },
    Load: function() {
        return this.connect().then(x => {
            return this.collection.findOne({_id: 1});
        });
    }
};

function init() {
    employee = {
        _id: 1,
        FirstName: "John",
        LastName: "Snow",
        Position: "None",
        Salary: 0,
        Location: "Winterfell",
        MaritalStatus: "Single",
        LastUpdated: new Date(2010, 01, 01),
        Version: 0,
    };

    Mango.Drop().then(() => Mango.Save(employee));
}

init();

var RabbitWrangler = {
    Publish: function(queueName, message) {
        var connectionString = process.env.RABBIT_CONNECTION || 'amqp://newhire:ultimate@localhost/';
        if(args[0]){
            hostName = args[0];
        }
        amqp.connect(connectionString, function(error0, connection) {
        if (error0) {
            throw error0;
        }
            // 1) Create connection to the channel
            connection.createChannel(function(error1, channel) {
                if (error1) {
                    throw error1;
                }
    
                // 2) Ensure we have the queue
                channel.assertQueue(queueName, {
                durable: false
                });

                // 3) Publish messages to the queue
                if(channel.sendToQueue(queueName, Buffer.from(message))){   
                    console.log(" [x] Sent %s", message);
                }
                else
                {
                    console.log("Failed to send message");                
                }
                // 4) Wait a little bit for the message to 
                //    actually send
                setTimeout(function() { 
                    connection.close(); 
                }, 500)        
            });
       });
    },
};

app.use(express.static(__dirname + '/site'));
app.use(myParser.json());

app.put("/updateEmployee", function(request, response) {
    var query = request.body;
    var messagePayload = {};
    var mongoUpdate = { $set: {}};
    var changed = false;
    
    if(!query)
    {
        return employee;
    }

    // 1) Enumerate thru each value in the request
    Object.keys(query).forEach(function(key) {
        if(key === "LastUpdated"){
            return;
        }
        if(employee[key] !== query[key]){
            // 2) If we find a property set to a value different than the current value, we set it
            messagePayload[key] = query[key];
            employee[key] = query[key];
            mongoUpdate.$set[key] = query[key];
            // 3) And indicate the aggregate has been changed
            changed = true;
        }
    });

    if(changed) {
        // 4) Create a message payload containing the updated properties
        employee.LastUpdated = new Date(Date.now());
        // 5) Increment the aggregate version
        employee.Version++;
        messagePayload.LastUpdated = employee.LastUpdated;
        messagePayload.Version = employee.Version;
        mongoUpdate.$set.LastUpdated = employee.LastUpdated;
        mongoUpdate.$set.Version = employee.Version;
        Mango.Update(mongoUpdate).then(() => Mango.Load().then(e => { employee = e; }));
        // 6) Publish the message to the queue.
        RabbitWrangler.Publish("employee", JSON.stringify(messagePayload));
    }

    response.setHeader('Content-Type', 'application/json');

    // 7) Return the updated aggregate
    response.end(JSON.stringify(employee));
});

app.get("/literallyOnlyEmployee", function(request, response){
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(employee));
});

app.listen(process.env.APP_PORT || "9090");