var Chart = function( width, height, data ) {
    if ( width === undefined )
        width = 400;
    if ( height === undefined )
        height = 600;

    var margin = { top: 250, right: 30, bottom: 30, left: 200 };
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    var time = { start: 1935, end: 2020 };

    var chart = d3.select( "body" ).append( "svg" )
         .attr( "width", width + margin.left + margin.right )
         .attr( "height", height + margin.top + margin.bottom )
         .append( "g" )
            .attr( "transform",
                   "translate(" + margin.left + "," +
                               margin.top + ")" );

    var timeScale = d3.scale.linear()
                      .domain( [ time.start, time.end ] )
                      .range( [ 0, height ] );
    var timeAxis = d3.svg.axis()
                     .scale( timeScale )
                     .tickFormat( d3.format( "   0" ) )
                     .orient( 'left' );

    var personScale = d3.scale.ordinal()
                        .domain( data.people.map( function( person ) {
                           return person.name;
                        } ) )
                        .rangeRoundBands( [ 0, width ], 0.1 );
    var personAxis = d3.svg.axis()
                       .scale( personScale )
                       .orient( 'bottom' );
    chart.append( 'text' )
        .attr( 'x',  - width / 2 )
        .attr( 'y', 10 - margin.left / 2 )
        .attr( 'font-size', '50px' )
        .attr( 'text-anchor', 'middle' )
        .attr( 'class', 'personLabel' )
        .attr( 'transform', 'rotate(-90)' )
        .text( 'Year of Event' );

    chart.append( 'text' )
        .attr( 'x', width / 2 )
        .attr( 'y', 75 - margin.top )
        .attr( 'font-size', '50px' )
        .attr( 'text-anchor', 'middle' )
        .attr( 'class', 'xAxisLabel' )
        .text( 'Person of Interest' );

    chart.append( "g" )
        .attr( 'class', 'time axis' )
        .call( timeAxis );
    chart.append( "g" )
            .attr( 'class', 'person axis' )
            .call( personAxis )
         .selectAll( "text" )
            .attr( "transform", "rotate(90)" )
            .style( 'text-anchor', 'end' )
            .attr( 'x', -9 );

    var personTip = d3.tip()
        .attr( 'class', 'd3-tip' )
        .html( function( person ) {
            return person.summary;
        });

    var people = chart.selectAll( "rect.person" )
        .data( data.people )
        .enter()
            .append( 'rect' )
            .attr( 'class', 'person' )
            .attr( 'x',
                   function( person ) {
                       console.log(person.name);
                       return personScale( person.name ) +
                              personScale.rangeBand() / 2 - 10;
                   } )
            .attr( 'y',
                   function( person ) {
                       return timeScale( person.born );
                   } )
            .attr( 'height',
                   function( person ) {
                       return timeScale( person.died || time.end ) - timeScale( person.born );
                   } )
            .attr( 'width', min( personScale.rangeBand(),
                                 20 ) )
            .on( 'mouseenter', personTip.show )
            .on( 'mouseout', personTip.hide );

    people.call( personTip );

    var getRelColor = function( idx ) {
        var colors = [ 'yellow', 'green', 'red', 'blue', 'orange' ];
        return colors[ idx % colors.length ];
    };

    var relTip = d3.tip()
        .attr( 'class', 'd3-tip' )
        .html( function( circle ) {
            return circle.rel.name;
        });

    var relations = chart.selectAll( "g.relation" )
        .data( data.relations ).enter()
        .append( 'g' )
        .attr( 'class', 'relation' )
        .attr( 'transform',
                function( rel ) {
                    return 'translate(' + 
                           personScale.rangeBand() / 2 + ', ' +
                           timeScale( rel.date ) + ')';
        } );
    var relCircles = relations.selectAll( "circle.relPerson" )
        .data( function( rel, i ) {
            return rel.parties.map( function( party ) {
                return { party: party, idx: i, rel: rel };
            } );
        } )
        .enter()
        .append( 'circle' )
            .attr( 'class', 'relPerson' )
            .attr( 'cx', function( party ) {
                            return personScale( party.party );
            } )
            .attr( 'r', 12 )
            .attr( 'fill', function( rel ) {
               return getRelColor( rel.idx );
            } )
            .on( 'mouseover', relTip.show )
            .on( 'mouseout', relTip.hide );
    relCircles.call( relTip );
    console.log( "gonna do lines" );
    relations.selectAll( 'line.relHorizontal' )
        .data( function( rel, i ) {
            return [ { parties: rel.parties,
                       idx: i } ];
        } )
        .enter()
        .append( 'line' )
            .style( 'stroke', function( rel ) {
               return getRelColor( rel.idx );
            } )
            .attr( 'x1', function( rel ) {
                return Math.min.apply( null,
                                       rel.parties.map( personScale ) );
            } )
            .attr( 'x2', function( rel ) {
                return Math.max.apply( null,
                                       rel.parties.map( personScale ) );
            } )
            ;

    console.log( "done" );
    this.setDaterange = function( startDate, endDate ) {
        if ( startDate == time.start && endDate == time.end ) {
            return;
        }
    };
    this.setWidthHeight = function( _width, _height ) {
        if ( _width == width && _height == height ) {
            return;
        }
    };
};

var chart;
$(document).ready(function() {
    chart = new Chart( 900, 900, dataset );

    $("#oops").mouseenter(function() {
        $(this).attr("fill", "blue");
    });

    $("#oops").mouseleave(function() {
        $(this).attr("fill", "yellow");
    });
});
