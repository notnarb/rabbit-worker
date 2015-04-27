# rabbit-worker
Very basic node module for creating and consuming from RabbitMQ work queues

## Why?

Because I am writing a lot of small services that use this sort of queue.  It is
just a light [rabbit.js](https://github.com/squaremo/rabbit.js) wrapper (if for
some weird reason you were hoping to use this project, I would instead you use
that library directly) that defaults to persistant queues and automatically
reconnects on connection failures.


## Synopsis

```js
var rabbitWorker = require('rabbit-worker');
var worker = new rabbitWorker.Worker('localhost', 'work_queue_1', function (message, ack) {
    console.log('got message', message);
    ack();					//important! Signals to the queue that the work has been completed
});
	
var tasker = new rabbitWorker.Tasker('localhost', 'work_queue_1');
if (tasker.isReady()) {
    tasker.publish('New message');
} else {
    tasker.once('ready', tasker.publish.bind(tasker, 'New message');
} 
```

## TODO

* Support for publisher confirms would be rad (I am currently living dangerously
and not using them in the interest of code simplicity).  Would require either a
modification in the upstream rabbit.js library or that this module be converted
to use amqplib as its upstream library directly (amqplib being the core module
that rabbit.js relies on).

# [jsdoc-to-markdown](https://github.com/jsdoc2md/jsdoc-to-markdown) output

<a name="module_rabbit-worker"></a>
## rabbit-worker
Light wrapper over the rabbit module to easily create persistent
workers and taskers.

**Version**: 0.0.1  
**Author:** notnarb  

* [rabbit-worker](#module_rabbit-worker)
  * [~Worker(rabbitserver, routingKey, workerFunction)](#module_rabbit-worker..Worker)
  * [~Tasker(rabbitserver, routingKey)](#module_rabbit-worker..Tasker) ⇐ <code>event.EventEmitter</code>
    * [.publish(message)](#module_rabbit-worker..Tasker#publish)
    * [.isReady()](#module_rabbit-worker..Tasker#isReady) ⇒ <code>Boolean</code>

<a name="module_rabbit-worker..Worker"></a>
### rabbit-worker~Worker(rabbitserver, routingKey, workerFunction)
connects to the specified rabbitmq server as a worker for the specified routing key

**Kind**: inner method of <code>[rabbit-worker](#module_rabbit-worker)</code>  

| Param | Type | Description |
| --- | --- | --- |
| rabbitserver | <code>String</code> | The hostname of the rabbit server to use |
| routingKey | <code>String</code> | the routing key to listen on |
| workerFunction | <code>function</code> | the function to call for each message. This function is called with 2 arguments: 'message', and 'ack'.  Message is a string representation of the data passed and 'ack' is a function that must be called to acknowledge the function.  Note: for simplicity: the function 'requeue' and 'discard' are omitted though they wouldn't be hard to add |

**Example**  
```js
var worker = new Worker('localhost', 'work_queue_1', function (message, ack) {
    console.log('got message', message);
    ack();					//important! Signals to the queue that the work has been completed
})
```
<a name="module_rabbit-worker..Tasker"></a>
### rabbit-worker~Tasker(rabbitserver, routingKey) ⇐ <code>event.EventEmitter</code>
connects to the specified rabbitmq server as a publisher for the
specified routing key.  Emits a 'ready' event when it can start taking
publish commands.

**Kind**: inner method of <code>[rabbit-worker](#module_rabbit-worker)</code>  
**Extends:** <code>event.EventEmitter</code>  

| Param | Type | Description |
| --- | --- | --- |
| rabbitserver | <code>String</code> | The hostname of the rabbit server to use |
| routingKey | <code>String</code> | the routing key to listen on |

**Example**  
```js
var tasker = new Tasker('localhost', 'work_queue_1');
if (tasker.isReady()) {
    tasker.publish('New message');
} else {
    tasker.once('ready', tasker.publish.bind(tasker, 'New message');
} 
```

* [~Tasker(rabbitserver, routingKey)](#module_rabbit-worker..Tasker) ⇐ <code>event.EventEmitter</code>
  * [.publish(message)](#module_rabbit-worker..Tasker#publish)
  * [.isReady()](#module_rabbit-worker..Tasker#isReady) ⇒ <code>Boolean</code>

<a name="module_rabbit-worker..Tasker#publish"></a>
#### tasker.publish(message)
Publishes a message to the queue

**Kind**: instance method of <code>[Tasker](#module_rabbit-worker..Tasker)</code>  
**Throws**:

- <code>Error</code> - if the queue is currently unavailable, this throws an error


| Param | Type | Description |
| --- | --- | --- |
| message | <code>String</code> | message to publish to the queue |

<a name="module_rabbit-worker..Tasker#isReady"></a>
#### tasker.isReady() ⇒ <code>Boolean</code>
Checks to see if the tasker is currently connected to the queue

**Kind**: instance method of <code>[Tasker](#module_rabbit-worker..Tasker)</code>  
**Returns**: <code>Boolean</code> - - true if currently can accept publish arguments  
