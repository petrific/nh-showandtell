#!/usr/bin/env node
var express = require("express");
var http = require('http');
var amqp = require('amqplib/callback_api');
var myParser = require("body-parser");
var app = express();
var args = process.argv.slice(2);

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

var RabbitWrangler = {
    Publish: function(queueName, message) {
        amqp.connect('amqp://newhire:ultimate@'+args[0], function(error0, connection) {
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
            if(channel.sendToQueue(queueName, Buffer.from(message))){   
                console.log(" [x] Sent %s", message);
            }
            else
            {
                console.log("Failed to send message");                
            }

            setTimeout(function() { 
                connection.close(); 
                }, 500)        });
       });
    },
};

app.use(express.static(__dirname + '/site'));
app.use(myParser.json());

app.put("/updateEmployee", function(request, response) {
    var query = request.body;
    var messagePayload = {};
    var changed = false;
    
    if(!query)
    {
        return employee;
    }

    Object.keys(query).forEach(function(key) {
        if(key === "LastUpdated"){
            return;
        }
        if(employee[key] !== query[key]){
            messagePayload[key] = query[key];
            employee[key] = query[key];
            changed = true;
        }
    });

    if(changed) {
        employee.LastUpdated = new Date(Date.now());
        employee.Version++;
        messagePayload.LastUpdated = employee.LastUpdated;
        messagePayload.Version = employee.Version;
        RabbitWrangler.Publish("employee", JSON.stringify(messagePayload));
    }

    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(employee));
});

app.get("/literallyOnlyEmployee", function(request, response){
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(employee));
});



app.listen("9090");