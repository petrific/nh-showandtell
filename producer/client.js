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
    LastUpdated: new Date(2010, 01, 01),
    Version: 0
};

var RabbitWrangler = {
    Publish: function(queueName, message) {
        amqp.connect('amqp://newhire:ultimate@localhost', function(error0, connection) {
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
app.use(myParser.urlencoded({extended : true}));
    app.get('*', function(req, res) {
        res.sendFile(__dirname + '/site/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });



app.put("/updateEmployee", function(request, response) {
    var query = request.query;
    var messagePayload = {};
    var changed = false;
    if(query.firstName && query.firstName != employee.FirstName)
    {
        employee.FirstName = query.firstName;
        messagePayload.firstName = employee.FirstName;
        changed = true;
    }

    if(query.lastName && query.lastName != employee.LastName)
    {
        employee.LastName = query.lastName;
        messagePayload.lastName = employee.LastName;
        changed = true;
    }    

    if(changed) {
        employee.LastUpdated = new Date(Date.now());
        employee.Version++;
        RabbitWrangler.Publish("employee", JSON.stringify(employee));
    }

    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(employee));
});

app.get("/literallyOnlyEmployee", function(request, response){
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(employee));
});



app.listen("9090");