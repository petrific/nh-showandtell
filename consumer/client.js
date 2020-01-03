#!/usr/bin/env node
var express = require("express");
var http = require('http');
var amqp = require('amqplib/callback_api');
var myParser = require("body-parser");
var app = express();

var employee = {
    FirstName: "John",
    LastName: "Snow",
    Position: "None",
    Salary: 0,
    Location: "Winterfell",
    MaritalStatus: "Single",
    LastUpdated: new Date(2010, 01, 01),
    Version: 0,
};

var args = process.argv.slice(2);
var consumedEvents = [];
var allConsumedEvents = [];

var RabbitWrangler = {
    Consume: function(queueName) {
        var connectionString = process.env.RABBIT_CONNECTION || 'amqp://newhire:ultimate@localhost/';
        console.log(connectionString);
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

                // 3) Consume messages from the queue
                channel.consume(queueName, function(msg){   
                    var contentStr = msg.content.toString();
                    console.log(" [x] Consumed %s", contentStr);
                    // 4) Parse the message data 
                    // (This is only because the message is JSON)
                    var data = JSON.parse(contentStr);

                    // 5) Add it to our consumtion queue
                    consumedEvents.push(data);

                    // 6) Also add it to the "event store"
                    allConsumedEvents.push(data);
                }, { noAck: true });
            });
        });
    }
};

RabbitWrangler.Consume('employee');

app.use(express.static(__dirname + '/site'));
app.use(myParser.json());

app.get("/applyEvent", function(request, response){
    var index = request.query.index;
    // 1) Get the event at the index
    var currEvent = consumedEvents[index];
    Object.keys(currEvent).forEach(function(key) {
        // Enumerate through each property 
        // and set any that matches to the properties
        if(employee.hasOwnProperty(key)){
            employee[key] = currEvent[key];
        }
    });
    // 2) Remove the event from our queue
    consumedEvents.splice(index, 1);
    response.setHeader('Content-Type', 'application/json');
    // 3) And send a response with the updated scope
    var payload = {
        events: consumedEvents,
        data: employee
    };
    response.end(JSON.stringify(payload));
});

app.get("/currentState", function(request, response){
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(employee));
});

app.get("/reset", function(request, response){
    consumedEvents = allConsumedEvents.slice();
    employee = {
        FirstName: "John",
        LastName: "Snow",
        Position: "None",
        Salary: 0,
        Location: "Winterfell",
        MaritalStatus: "Single",
        LastUpdated: new Date(2010, 01, 01),
        Version: 0,
    };    
    var payload = {
        events: consumedEvents,
        data: employee
    };
    response.end(JSON.stringify(payload));
});

app.get("/getEvents", function(request, response){
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(consumedEvents));
});

app.listen(process.env.APP_PORT || "8080");