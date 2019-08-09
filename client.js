#!/usr/bin/env node
var express = require("express");
var http = requre('http');
var amqp = require('amqplib/callback_api');
var myParser = require("body-parser");
var app = express();

var employee = {
    FirstName: "John",
    LastName: "Snow",
    Position: "None",
    Salary: 0,
    Location: "Winterfell",
    LastUpdated: new Date(2010, 01, 01)
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
            channel.sendToQueue(queueName, Buffer.from(msg));    
            console.log(" [x] Sent %s", msg);
            connection.close();
        });
       });
    },
};

app.use(express.static(__dirname + '/site'));


app.use(myParser.urlencoded({extended : true}));



app.put("/employee", function(request, response) {
    console.log(request.query.name); /* This prints the  JSON document received (if it is a JSON document) */
});

app.get("/literallyOnlyEmployee", function(request, response){
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(employee));
});

app.listen("9090");