var xor = ( x, y ) => {
    return ( x || y ) && !( x && y );
};

var DummyQueue = function () {
    var queue = [];

    this.enqueue = ( data ) => {
        queue.push( data );
    };
    this.dequeue = () => {
        return queue.shift();
    };
    this.emptyP = () => {
        return queue.length === 0;
    };
};

/**
 * args should be of form: {
 *    [
 *       enqueueFunction: function that is called to add a job to the queue,
 *       dequeueFunction: function that is called to grab a job from the queue,
 *       queueEmpty: function that checks if the queue is empty
 *    ]
 *    workerFactory: function to call to start a worker... should return a promise,
 *    [ numWorkers: maximum number of workers to run at once... default 1 ]
 *    [ callback: function to call when |done| returns true ]
 */
module.exports.QueuedWorkers = function ( args ) {
    if ( xor( args.enqueueFunction, args.dequeueFunction ) ) {
        throw "Must define both dequeue and enqueue or neither";
    }
    if ( args.workerFactory === undefined ) {
        throw "Must befine workerFactory";
    }

    let defaultQueue = new DummyQueue();
    var enqueue = args.enqueueFunction || defaultQueue.enqueue;
    var dequeue = args.dequeueFunction || defaultQueue.dequeue;
    var queueEmptyP = args.queueEmpty || defaultQueue.emptyP;

    var startWorker = args.workerFactory;
    var maxNumWorkers = args.numWorkers || 1;
    var numFreeWorkers = maxNumWorkers;

    var doneP = false;

    var tryStartWorkers = () => {
        while ( numFreeWorkers > 0 && !queueEmptyP() ) {
            let work = dequeue();
            numFreeWorkers--;
            startWorker( work )
                .then( workerFinish )
                .catch( workerFinish );
        }
    };

    var checkDone = () => {
        if ( numFreeWorkers === maxNumWorkers && queueEmptyP() && doneP ) {
            if ( args.callback ) {
                args.callback();
            }
            return true;
        }
        else {
            return false;
        }
    };

    var workerFinish = () => {
        numFreeWorkers++;
        

        if ( !checkDone() ) {
            tryStartWorkers();
        }
    };

    this.push = ( job ) => {
        enqueue( job );
        tryStartWorkers();
    };

    this.endOfQueue = () => {
        doneP = true;
        checkDone();
    };
};
