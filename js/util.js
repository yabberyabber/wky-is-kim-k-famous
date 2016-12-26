var getImportance = function( number ) {
    if ( number === 0 ) {
        return 0;
    }

    var factors = [ 1, 5, 25 ];
    var repeater = 10;

    var importance = 1;
    var i = 0;
    var repititions = 0;
    while ( number % ( factors[ i ] * Math.pow( repeater, repititions ) ) === 0 ) {
        importance++;
        i++;
        if ( i >= factors.length ) {
            i = 0;
            repititions++;
        }
    }
    return importance - 1;
};

console.assert( getImportance( 1 ) == 1 );
console.assert( getImportance( 5 ) == 2 );
console.assert( getImportance( 25 ) == 3 );
console.assert( getImportance( 50 ) == 5 );

var min = function( x, y ) {
    if ( x < y ) {
        return x;
    }
    else {
        return y;
    }
};

var max = function( x, y ) {
    if ( x > y ) {
        return x;
    }
    else {
        return y;
    }
};
