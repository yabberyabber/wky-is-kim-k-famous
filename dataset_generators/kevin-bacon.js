const Priorityset = require( './prioritySet.js' );
const JobQueue = require( './jobqueue.js' );
const querystring = require( 'querystring' );
const fetch = require( 'node-fetch' );
const Wiki = require( 'wikijs' );
const fs = require( 'fs' );

const API_KEY = '2a265e8edc9251252de448540935d2f1';
const MAX_ACTORS = 60;
const MAX_MOVIES = 100;

const MAX_ACTOR_WORKERS = 2;
const MAX_MOVIE_WORKERS = 2;

var actorsExplored = {};
var moviesExplored = {};

actorsToExplore.push( "Kevin Bacon" );
actorsToExplore.push( "Kevin Bacon" );
actorsToExplore.push( "Carrie Fisher" );
actorsToExplore.push( "Carrie Fisher" );
actorsToExplore.push( "Debbie Reynolds" );
actorsToExplore.push( "Debbie Reynolds" );
var moviesToExplore = {};

var PersonSearcher = ( function() {
    var wiki = Wiki.default();
    var personSearchQuery = ( person ) => {
        return 'https://api.themoviedb.org/3/search/person?api_key=' + API_KEY +
            '&language=en-US&query=' + querystring.escape( person ) +
            '&page=1&include_adult=false';
    };
    var castSearchQuery = ( movieId ) => {
        return 'https://api.themoviedb.org/3/movie/' + movieId +
            '/credits?api_key=' + API_KEY;
    };
    var movieSearchQuery = ( movieId ) => {
        return 'https://api.themoviedb.org/3/movie/' + movieId +
            '?api_key=' + API_KEY;
    };

    var parseDate = ( string ) => {
        if ( string ) {
            var subs = string.split( '|' );
            for ( var i = 0; i < subs.length; i++ ) {
                if ( subs[ i ].length == 4 && subs[ i ][ 0 ] == '1' ) {
                    return parseInt( subs[ i ] );
                }
            }
        }
        else {
            return undefined;
        }
    };

    var getMovieInfo = ( movieId ) => {
        return new Promise( ( fulfill, reject ) => {
            fetch( movieSearchQuery( movieId ) )
                .then( ( res ) => { return res.json(); } )
                .then( ( json ) => {
                    //console.log( json );
                    if ( json.release_date === undefined ) {
                        reject( "NO RESULTS FOR GETMOVIEINFO", movieId );
                    }

                    var release = json.release_date.split( '-' );
                    if ( release === undefined ) {
                        reject();
                    }
                    release = parseInt( release[ 0 ] ) + 
                        ( parseInt( release[ 1 ] ) / 12.0 );

                    fulfill( { movieId: movieId,
                               release: release,
                               summary: json.overview,
                               title: json.title } );
                } )
                .catch( reject );
        } );
    };

    var getActors = ( movieId ) => {
        return new Promise( ( fulfill, reject ) => {
            fetch( castSearchQuery( movieId ) )
                .then( ( res ) => { return res.json(); } )
                .then( ( json ) => {
                    //console.log( json );
                    if ( json.cast === undefined ) {
                        reject();
                    }

                    var actors = json.cast.filter( ( cast ) => {
                        return cast.order < 10;
                    } ).map( ( cast ) => {
                        return cast.name;
                    } );

                    fulfill( actors );
                } )
                .catch( reject );
        } );
    };

    var getMovies = ( person ) => {
        return new Promise( ( fulfill, reject ) => {
            fetch( personSearchQuery( person ) )
                .then( ( res ) => { return res.json(); } )
                .then( ( json ) => {
                    if ( json.results === undefined ||
                            json.results[ 0 ] === undefined ||
                            json.results[ 0 ].known_for === undefined ) {
                        reject( "NO RESULTS FOR PERSON", person );
                    }

                    fulfill( json.results[ 0 ].known_for.map( ( movie ) => {
                       return {
                           person: person,
                           title: movie.original_title,
                           id: movie.id
                       };
                    } ) );
                } )
                .catch( reject );
        } );
    };
    
    var getBio = ( person ) => {
        return wiki.page( person ).then( ( page ) => {
            return Promise.all( [
                page.info(),
                page.summary()
            ] ).then( ( res ) => {
                console.log( res[ 0 ].birth_date );
                console.log( parseDate( res[ 0 ].birth_date ) );
                return {
                    person: person,
                    birthdate: parseDate( res[ 0 ].birth_date ),
                    deathdate: parseDate( res[ 0 ].death_date ),
                    summary: res[ 1 ]
                };
            } );
        } );
    };

    return {
        searchPerson: ( person ) => {
            return Promise.all( [
                    getMovies( person ),
                    getBio( person )
            ] ).then( ( res ) => {
                return {
                    name: person,
                    known_for: res[ 0 ],
                    birth: res[ 1 ].birthdate,
                    death: res[ 1 ].deathdate,
                    summary: res[ 1 ].summary
                };
            } );
        },
        searchMovie: ( movieId ) => {
            return Promise.all( [
                    getActors( movieId ),
                    getMovieInfo( movieId )
            ] ).then( ( res ) => {
                return {
                    actors: res[ 0 ], 
                    title: res[ 1 ].title,
                    summary: res[ 1 ].summary,
                    release: res[ 1 ].release,
                    movieInfo: res[ 1 ],
                    movieId: movieId
                };
            } );
        }
    };
} )();

var actorQueue = ( () => {
    var allActorsSeen = [];
    var queue = [];

    this.enqueue = ( data ) => {
        if ( allActorsSeen.indexOf( data ) == -1 ) {
            queue.push( data );
            allActorsSeen.push( data );
        }
    };
    this.dequeue = () => {
        return queue.shift();
    };
    this.emptyP = () => {
        return queue.length === 0;
    };
} ) ();

var doMovieSearch = ( movie ) => {
    return PersonSearcher.searchMovie( movie.id ).then( ( movie ) => {
        moviesExplored[ movie.movieId ] =
            moviesExplored[ movie.movieId ] || {
                actors: [], name: movie.title, summary: movie.summary,
                date: movie.release, movieId: movie.movieId
            };


        movie.actors.forEach( ( name ) => {
            personQueue.push( name );
            moviesExplored[ movie.movieId ].actors.push( name );
        } );
    } );
};

var movieResolver;
var moviePromise = new Promise( ( resolve, reject ) => { movieResolver = resolve; } );

var movieQueue = new JobQueue.QueuedWorkers( {
    enqueueFunction: actorQueue.enqueue,
    dequeueFunction: actorQueue.dequeue,
    queueEmpty: actorQueue.emptyP,
    workerFactory: doMovieSearch,
    numWorkers: MAX_MOVIE_WORKERS,
    callback: () => { movieResolver( 0 ); }
} );

var handleMovie = ( movie ) => {
    console.log( "GOT MOVIE: ", movie.title );
    moviesExplored[ movie.movieId ] = moviesExplored[ movie.movieId ] ||
                                      { actors: [],
                                        name: movie.title,
                                        summary: movie.summary,
                                        date: movie.release,
                                        movieId: movie.movieId
                                      };

    if ( Object.keys( moviesExplored ).length == MAX_MOVIES ) {
        movieResolver();
    }

    restartMovieSearch( "no problem" );
    movie.actors.forEach( ( name ) => {
        startPersonSearch( name );
        moviesExplored[ movie.movieId ].actors.push( name );
    } );
};

var personWorkers = MAX_ACTOR_WORKERS;
var personResolver;
var personPromise = new Promise( ( resolve, reject ) => { personResolver = resolve; } );
var handlePerson = ( person ) => {
    console.log( "GOT ACTOR: ", person.name );
    
    actorsExplored[ person.name ] = person;
    if ( Object.keys( actorsExplored ).length == MAX_ACTORS ) {
        personResolver();
    }

    restartPersonSearch( "no problem" );
    person.known_for.forEach( ( movie ) => {
        console.log( "form actor -> ", movie );
        startMovieSearch( movie );
    } );
};

var restartPersonSearch = ( reason ) => {
    personWorkers = Math.min( personWorkers + 1, MAX_ACTOR_WORKERS );
    console.log( "restarting person search after rejection", reason );
    let actor = actorsToExplore.pop();
    if ( actor ) {
        console.log( "  RESTARTING", actor );
        startPersonSearch( actor );
    }
    else {
        console.log( "  there are no actors in queue", actorsToExplore.get() );
    }
};

var startPersonSearch = ( name ) => {
    if ( Object.keys( actorsExplored ).length >= MAX_ACTORS &&
         Object.keys( moviesExplored ).length >= MAX_MOVIES ) {
        console.log( "we done here" );
        movieResolver();
        personResolver();
        return;
    }

    if ( actorsExplored[ name ] ) {
        console.log( name, " actor already in queue" );
        if ( personWorkers > 0 && !actorsToExplore.emptyP() ) {
            startPersonSearch( actorsToExplore.pop() );
        }
        return;
    }
    
    if ( personWorkers === 0 ) {
        console.log( "QUEUEING ACTOR ", name );
        actorsToExplore.push( name );
        return;
    }

    console.log( "STARTING ACTOR ", name );
    personWorkers--;
    actorsToExplore.pull( name );
    PersonSearcher.searchPerson( name ).then( handlePerson )
        .catch( restartPersonSearch );
};

var restartMovieSearch = ( reason ) => {
    movieWorkers = Math.min( movieWorkers + 1, MAX_MOVIE_WORKERS );
    console.log( "restarting movie search after rejection", reason );
    let anyKey = Object.keys( moviesToExplore )[ 0 ];
    let movie = moviesToExplore[ anyKey ];
    delete moviesToExplore[ anyKey ];
    if ( movie ) {
        console.log( "  RESTARTING", movie );
        startMovieSearch( movie );
    }
    else {
        console.log( "  there are no movies in queue", moviesToExplore );
    }
};

var startMovieSearch = ( movie ) => {
    if ( Object.keys( actorsExplored ).length >= MAX_ACTORS &&
         Object.keys( moviesExplored ).length >= MAX_MOVIES ) {
        console.log( "we done here" );
        movieResolver();
        personResolver();
        return;
    }

    if ( movie === undefined || movie.id === undefined ) {
        console.log( "CORRUPT MOVIE: ", movie );
    }
    if ( moviesExplored[ movie.id ] ||
            moviesToExplore[ movie.id ] ) {
        console.log( movie.title, " movie already in queue" );
        if ( movieWorkers > 0 ) {
            console.log( "movie queue: ", moviesToExplore );
            let anyKey = Object.keys( moviesToExplore )[ 0 ];
            let todo = moviesToExplore[ anyKey ];
            delete moviesToExplore[ anyKey ];
            if ( todo ) {
                startMovieSearch( todo );
            }
        }
        return;
    }

    if ( movieWorkers === 0 ) {
        console.log( "QUEUEING MOVIE ", movie.title );
        moviesToExplore[ movie.id ] = { id: movie.id, title: movie.title };
        return;
    }

    console.log( "STARTING MOVIE ", movie.title );
    movieWorkers--;
    PersonSearcher.searchMovie( movie.id ).then( handleMovie )
        .catch( restartMovieSearch );
};

restartPersonSearch( "Starting" );

/*
PersonSearcher.getMovies( SEED_ACTOR ).then( console.log );
PersonSearcher.getMovies( 'Carrie Fisher' ).then( console.log );
PersonSearcher.searchMovie( 11 ).then( console.log );
*/

Promise.race( [
        Promise.all( [ moviePromise, personPromise ] )
        //, new Promise( ( f, r ) => { setTimeout( f, 150000, 0 ); } )
] ).then( () => {
//setTimeout( () => {
    console.log( "\n\nACTORS EXPLORED:\n", actorsExplored );
    console.log( "\n\nMOVIES EXPLORED:\n", moviesExplored );
    console.log( "to explore: ", actorsToExplore.get(), moviesToExplore );
    console.log( "workers: ", personWorkers, movieWorkers );
    console.log( "lengths: ", Object.keys( actorsExplored ).length,
                              Object.keys( moviesExplored ).length );

    fs.writeFile( 'kevin-bacon-dataset.json',
                  JSON.stringify(
                      trimDataset(
                          formatDataset( actorsExplored, moviesExplored ) ) ),
                  ( err ) => {
                     if ( err ) {
                        console.log( "error:", err );
                     }
                     else {
                        console.log( "success" );
                     }
                  } );
//}, 30000 );
} );

var formatDataset = ( actors, movies ) => {
    var dataset = { people: [], relations: [] };
    for ( var actor in actors ) {
        actor = actors[ actor ];
        dataset.people.push( {
            name: actor.name,
            born: parseInt( actor.birth ) || undefined,
            died: parseInt( actor.death ) || undefined,
            summary: actor.summary
        } );
    }

    var actorInActors = ( actor ) => {
        return actors[ actor ] !== undefined;
    };

    for ( var movie in movies ) {
        movie = movies[ movie ];
        dataset.relations.push( {
            date: movie.date,
            parties: movie.actors.filter( actorInActors ),
            name: movie.name
        } );
    }

    return dataset;
};

var trimDataset = ( dataset ) => {
    var actors = dataset.people.map( ( person ) => { return person.name; } );

    var actorCounts = {};
    dataset.relations.forEach( ( relation ) => {
        if ( relation.parties.length >= 2 ) {
            relation.parties.forEach( ( actor ) => {
                actorCounts[ actor ] = 
                    ( actorCounts[ actor ] || 0 ) + 1;
            } );
        }
    } );

    var doesActorMatterP = ( actor ) => {
        if ( actor.name === undefined ) {
            actor = { name: actor };
        }
        return ( actorCounts[ actor.name ] > 2 &&
                 actors.indexOf( actor.name ) > -1 );
    };

    dataset.people = dataset.people.filter( doesActorMatterP );

    var filteredMovies = [];
    dataset.relations.forEach( ( relation ) => {
        var filteredActors = relation.parties.filter( doesActorMatterP );
        if ( filteredActors.length > 0 ) {
            relation.parties = filteredActors;
            filteredMovies.push( relation );
        }
    } );
    dataset.relations = filteredMovies;

    console.log( "actors now", dataset.people.length,
            " movies now ", dataset.relations.length );
    console.log( "actors", dataset.people.map( ( person ) => { return person.name; } ) );

    return dataset;
};
