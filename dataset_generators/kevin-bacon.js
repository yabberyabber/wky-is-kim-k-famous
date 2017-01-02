const PrioritySet = require( './prioritySet.js' );
const JobQueue = require( './jobqueue.js' );
const querystring = require( 'querystring' );
const fetch = require( 'node-fetch' );
const Wiki = require( 'wikijs' );
const fs = require( 'fs' );

const API_KEY = '2a265e8edc9251252de448540935d2f1';
const MAX_ACTORS = 30;
const MAX_MOVIES = 50;

const MAX_ACTOR_WORKERS = 2;
const MAX_MOVIE_WORKERS = 2;

var actorsExplored = {};
var moviesExplored = {};

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
                    if ( json.release_date === undefined ) {
                        reject( "NO RESULTS FOR GETMOVIEINFO" + movieId );
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
                        reject( "NO RESULTS FOR PERSON " + person );
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

var movieQueue = JobQueue.filterUnique( new JobQueue.DummyQueue() );

var doMovieSearch = ( movie ) => {
    return new Promise( ( fulfill, reject ) => {
        PersonSearcher.searchMovie( movie.id ).then( ( movie ) => {
            moviesExplored[ movie.movieId ] =
                moviesExplored[ movie.movieId ] || {
                    actors: [], name: movie.title, summary: movie.summary,
                    date: movie.release, movieId: movie.movieId
                };

            var getElement = ( key ) => { return moviesExplored[ key ]; };
            var getName = ( movie ) => { return movie.name; };

            if ( Object.keys( moviesExplored ).length == MAX_MOVIES ) {
                movieWorker.endOfQueue();
            }

            if ( Object.keys( moviesExplored ).length <= MAX_MOVIES ||
                    Object.keys( actorsExplored ).length <= MAX_ACTORS ) {
                movie.actors.forEach( ( name ) => {
                    console.log( "from movie ->", name );
                    actorWorker.push( name );
                    moviesExplored[ movie.movieId ].actors.push( name );
                } );
            }

            fulfill( 0 );
        } ).catch( ( reason ) => {
            console.log( "FAILED MOVIE SEARCH BECAUSE ", reason );
            reject( reason );
        } );
    } );
};

var movieResolver;
var moviePromise = new Promise( ( resolve, reject ) => { movieResolver = resolve; } );

var movieWorker = new JobQueue.QueuedWorkers( {
    enqueueFunction: movieQueue.enqueue,
    dequeueFunction: movieQueue.dequeue,
    queueEmpty: movieQueue.emptyP,
    workerFactory: doMovieSearch,
    numWorkers: MAX_MOVIE_WORKERS,
    callback: () => { movieResolver( 0 ); }
} );

var actorQueue = new PrioritySet.Pset();

var doActorSearch = ( name ) => {
    console.log( "actors to search: ", actorQueue.get().length );
    return new Promise( ( fulfill, reject ) => {
        PersonSearcher.searchPerson( name ).then( ( person ) => {
            console.log( "GOT ACTOR: ", person.name );
            
            actorsExplored[ person.name ] = person;
            if ( Object.keys( actorsExplored ).length == MAX_ACTORS ) {
                actorWorker.endOfQueue();
            }

            if ( Object.keys( actorsExplored ).length <= MAX_ACTORS ||
                    Object.keys( moviesExplored ).length <= MAX_MOVIES ) {
                person.known_for.forEach( ( movie ) => {
                    console.log( "form actor -> ", movie );
                    movieWorker.push( movie );
                } );
            }

            fulfill( 0 );
        } ).catch( ( reason ) => {
            console.log( "FAILED ACTOR SEARCH BECAUSE", reason );
            reject( reason );
        } );
    } );
};

var actorResolver;
var actorPromise = new Promise( ( resolve, reject ) => { actorResolver = resolve; } );

var actorWorker = new JobQueue.QueuedWorkers( {
    enqueueFunction: actorQueue.push,
    dequeueFunction: actorQueue.pop,
    queueEmpty: actorQueue.emptyP,
    workerFactory: doActorSearch,
    numWorkers: MAX_ACTOR_WORKERS,
    callback: () => { actorResolver( 0 ); }
} );
actorWorker.push( "Kevin Bacon" );
actorWorker.push( "Carrie Fisher" );
actorWorker.push( "Debbie Reynolds" );

Promise.all( [ moviePromise, actorPromise ] ).then( () => {
    console.log( "\n\nACTORS EXPLORED:\n", actorsExplored );
    console.log( "\n\nMOVIES EXPLORED:\n", moviesExplored );
    console.log( "to explore: ", actorQueue.get() );
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
