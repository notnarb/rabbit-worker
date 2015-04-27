/**
 * @author notnarb
 * @module rabbit-worker
 * @desc Light wrapper over the rabbit module to easily create persistent
 * workers and taskers.
 * @version 0.0.1
 */
var util = require('util');
var events = require('events');
var debug = require('debug')('rabbit-worker');
var rabbit = require('rabbit.js');

/**
 * @classdesc Rabbit worker.  Listens for tasks initiated by a 'tasker'
 * @desc connects to the specified rabbitmq server as a worker for the specified routing key
 * @param {String} rabbitserver - The hostname of the rabbit server to use
 * @param {String} routingKey - the routing key to listen on
 * @param {function} workerFunction - the function to call for each message.
 * This function is called with 2 arguments: 'message', and 'ack'.  Message is a
 * string representation of the data passed and 'ack' is a function that must be
 * called to acknowledge the function.  Note: for simplicity: the function
 * 'requeue' and 'discard' are omitted though they wouldn't be hard to add
 * @example
 * var worker = new Worker('localhost', 'work_queue_1', function (message, ack) {
 *     console.log('got message', message);
 *     ack();					//important! Signals to the queue that the work has been completed
 * })
 */
function Worker (rabbitServer, routingKey, workerFunction) {
	if (!rabbitServer || !routingKey || !workerFunction) {
		throw new Error('Invalid args: requires rabbit server and routing key');
	}
	this.rabbitServer = rabbitServer;
	this.routingKey = routingKey;
	this.workerFunction = workerFunction;
	this._initConnection();
}

/**
 * Initializes the connection to the queue
 * @private
 */
Worker.prototype._initConnection = function () {
	debug('connecting to', this.rabbitServer);
	var context = require('rabbit.js').createContext('amqp://' + this.rabbitServer);

	context.on('ready', function () {
		var worker = context.socket('WORKER', {persistent: true, prefetch: 1});
		worker.connect(this.routingKey, function () {
			debug('connected to route', this.routingKey);
			worker.setEncoding('utf8');
			worker.on('data', function (message) {
				this.workerFunction(String(message), worker.ack.bind(worker));
			}.bind(this));
		}.bind(this));

	}.bind(this));
	context.on('error', function (error) {
		debug('failed to connect to context', error, 'reconnecting in 1 second');
		setTimeout(this._initConnection.bind(this), 1000);
	}.bind(this));
	
};
module.exports.Worker = Worker;

/**
 * @classdesc Rabbit 'Publisher'.  Creates task for a corresponding worker
 * @desc connects to the specified rabbitmq server as a publisher for the
 * specified routing key.  Emits a 'ready' event when it can start taking
 * publish commands.
 * @extends event.EventEmitter
 * @param {String} rabbitserver - The hostname of the rabbit server to use
 * @param {String} routingKey - the routing key to listen on
 * @example
 * var tasker = new Tasker('localhost', 'work_queue_1');
 * if (tasker.isReady()) {
 *     tasker.publish('New message');
 * } else {
 *     tasker.once('ready', tasker.publish.bind(tasker, 'New message');
 * } 
 */
function Tasker (rabbitServer, routingKey) {
	events.EventEmitter.call(this);
	if (!rabbitServer || !routingKey) {
		throw new Error('Missing argument rabbitServer or routingKey');
	}
	this.rabbitServer = rabbitServer;
	this.routingKey = routingKey;
	this.currentPublishSocket = null;
	this._initConnection();
}
util.inherits(Tasker, events.EventEmitter);

/**
 * Initializes the connection to the queue
 * @private
 */
Tasker.prototype._initConnection = function () {
	debug('connecting');
	var context = require('rabbit.js').createContext('amqp://' + this.rabbitServer);

	context.on('ready', function () {
		var publisher = context.socket('PUSH', {persistent: true});
		publisher.connect(this.routingKey, function () {
			this.emit('ready');
			debug('connected');
			this.currentPublishSocket = publisher;
		}.bind(this));
	}.bind(this));
	context.on('error', function (error) {
		this.currentPublishSocket = null;
		debug('failed to connect to context', error, 'reconnecting in 1 second');
		setTimeout(this._initConnection.bind(this), 1000);
	}.bind(this));
};

/**
 * Publishes a message to the queue
 * @param {String} message - message to publish to the queue
 * @throws {Error} - if the queue is currently unavailable, this throws an error
 */
Tasker.prototype.publish = function (message) {
	if (!this.currentPublishSocket) {
		throw new Error('Not connected to queue');
	}
	return this.currentPublishSocket.write(String(message), 'utf8');
};

/**
 * Checks to see if the tasker is currently connected to the queue
 * @returns {Boolean} - true if currently can accept publish arguments
 */
Tasker.prototype.isReady = function () {
	return !!this.currentPublishSocket;
};

module.exports.Tasker = Tasker;
