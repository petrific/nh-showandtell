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

var RabbitWrangler = {
    Consume: function(queueName) {

        amqp.connect('amqp://newhire:ultimate@' + args[0], function(error0, connection) {
            if (error0) {
                throw error0;
            }
            connection.createChannel(function(error1, channel) {
                if (error1) {
                    throw error1;
                }
    
                channel.assertQueue(queueName, {
                    durable: false
                });
                channel.consume(queueName, function(msg){   
                    var contentStr = msg.content.toString();
                    console.log(" [x] Consumed %s", contentStr);
                    var data = JSON.parse(contentStr);
                    consumedEvents.push(data);
                }, { noAck: true });
            });
        });
    }
};

RabbitWrangler.Consume('employee');

app.use(express.static(__dirname + '/site'));
app.use(myParser.json());

app.get("/currentState", function(request, response){
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(employee));
});

app.get("/applyEvent", function(request, response){
    var index = request.query.index;
    var currEvent = consumedEvents[index];
    Object.keys(currEvent).forEach(function(key) {
        if(employee[key]){
            employee[key] = currEvent[key];
        }
    });
    consumedEvents.pop(currEvent);
    response.setHeader('Content-Type', 'application/json');
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

app.listen("8080");