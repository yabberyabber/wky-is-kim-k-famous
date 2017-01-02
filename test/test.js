var assert = require( 'assert' );

describe( 'Priority Set', function() {
    let pset = require( '../dataset_generators/prioritySet.js' );

    it( "empty set should act rationally", function() {
        let p = new pset.Pset();

        assert.equal( undefined, p.pop() );
    } );
    it( "push pop logically", function() {
        let p = new pset.Pset();

        p.push( 7 );
        assert.equal( 7, p.pop() );
        assert.equal( undefined, p.pop() );
        p.push( 6 );
        p.push( 6 );
        p.push( 5 );
        assert.equal( 6, p.pop() );
        assert.equal( 5, p.pop() );
        assert.equal( undefined, p.pop() );
    } );
    it( "empty and contains", function() {
        let p = new pset.Pset();

        assert.equal( true, p.emptyP() );
        assert.notStrictEqual( [], p.get() );

        p.push( 7 );
        assert.equal( false, p.emptyP() );
        assert.notStrictEqual( [ 7 ], p.get() );

        p.pop();
        assert.equal( true, p.emptyP() );
        assert.notStrictEqual( [], p.get() );
    } );
    it( "pull", function() {
        let p = new pset.Pset();

        p.pull( "oops" );
        p.push( "yes" );
        p.pull( "yes" );
        assert.equal( true, p.emptyP() );
    } );
} );

describe( "jobqueue", function() {
    let jobqueue = require( '../dataset_generators/jobqueue.js' );

    it( "make", function( done ) {
        let resQueue = [];
        let numCallbacks = 0;

        let testWorker = ( job ) => {
            return new Promise( ( f, r ) => {
                numCallbacks++;
                resQueue.push( job );
                f( job );
            } );
        };

        let callback = () => {
            assert.equal( true, 
                          arraysEqual( resQueue, [ 1, 2, 3, 4, 5 ] ) );
            assert.equal( 5, numCallbacks );
            done();
        };
        let queue = new jobqueue.QueuedWorkers( {
            workerFactory: testWorker,
            callback: callback
        } );
        [ 1, 2, 3, 4, 5 ].forEach( ( i ) => { queue.push( i ); } );
        queue.endOfQueue();
    } );
} );

var arraysEqual = ( x, y ) => {
    if ( x.length != y.length ) {
        return false;
    }
    for ( var i = 0; i < x.length; i++ ) {
        if ( x[ i ] !== y[ i ] ) {
            return false;
        }
    }
    return true;
};
