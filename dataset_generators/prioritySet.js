module.exports.Pset = function() {
    let elements = {};

    this.push = ( element ) => {
        elements[ element ] = ( elements[ element ] || 0 ) + 1;
    };

    this.pop = () => {
        let keys = Object.keys( elements );
        if ( keys.length === 0 ) {
            return undefined;
        }

        let maximizer = keys[ 0 ];
        let maximum = elements[ maximizer ];
        for ( var i = 0; i < keys.length; i++ ) {
            let key = keys[ i ];
            if ( elements[ key ] > maximum ) {
                maximum = elements[ key ];
                maximizer = key;
            }
        }

        delete elements[ maximizer ];
        return maximizer;
    };

    this.containsP = ( element ) => {
        return elements[ element ] !== undefined;
    };

    this.emptyP = () => {
        return Object.keys( elements ).length === 0;
    };

    this.get = () => {
        return Object.keys( elements );
    };

    this.pull = ( key ) => {
        delete elements[ key ];
    };
};
