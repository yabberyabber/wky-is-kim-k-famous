var Chart = function( width, height ) {
    if ( width === undefined )
        width = 400;
    if ( height === undefined )
        height = 600;

    var margin = { top: 250, right: 30, bottom: 30, left: 200 };
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    var time = { start: 1930, end: 2020 };

    var chart = d3.select( "body" ).append( "svg" )
         .attr( "width", width + margin.left + margin.right )
         .attr( "height", height + margin.top + margin.bottom )
         .append( "g" )
            .attr( "transform",
                   "translate(" + margin.left + "," +
                               margin.top + ")" );

    var backLayer = chart.append( 'g' );
    var frontLayer = chart.append( 'g' );

    var timeScale = d3.scale.linear()
                      .domain( [ time.start, time.end ] )
                      .range( [ 0, height ] );
    var timeAxis = d3.svg.axis()
                     .scale( timeScale )
                     .tickFormat( d3.format( "   0" ) )
                     .orient( 'left' );
    backLayer.append( "g" )
        .attr( 'class', 'time_axis' )
        .call( timeAxis );
    backLayer.append( 'text' )
        .attr( 'x',  - width / 2 )
        .attr( 'y', 10 - margin.left / 2 )
        .attr( 'font-size', '50px' )
        .attr( 'class', 'yearLabel axisLabel' )
        .attr( 'transform', 'rotate(-90)' )
        .text( 'Year of Event' );

    var personScale = d3.scale.ordinal()
                        .domain( [ 'No one has loaded yet :(' ] )
                        .rangeRoundBands( [ 0, width ], 0.1 );
    var personAxis = d3.svg.axis()
                       .scale( personScale )
                       .orient( 'bottom' );
    backLayer.append( "g" )
            .attr( 'class', 'person_axis' )
            .call( personAxis )
         .selectAll( "text" )
            .attr( "transform", "rotate(90)" )
            .style( 'text-anchor', 'end' )
            .attr( 'x', -9 );
    backLayer.append( 'text' )
        .attr( 'x', width / 2 )
        .attr( 'y', 75 - margin.top )
        .attr( 'font-size', '50px' )
        .attr( 'class', 'personLabel axisLabel' )
        .text( 'Person of Interest' );

    var personTip = d3.tip()
        .attr( 'class', 'd3-tip' )
        .html( function( person ) {
            return person.summary;
        });
    
    this.updateData = function( dataset ) {
        personScale.domain( dataset.people.map(
                                function( person ) {
                                    return person.name;
                                } ) )
                   .rangeRoundBands( [ 0, width ], 0.1 );
        backLayer.select( ".person_axis" )
             .call( personAxis )
             .selectAll( "text" )
                .attr( "transform", "rotate(-45)" )
                .style( 'text-anchor', 'start' )
                .attr( 'x', 12 )
                .attr( 'y', -12 );

        var people = backLayer.selectAll( "rect.person" )
            .data( dataset.people );
        var personBarXFunction = function( person ) {
            return personScale( person.name ) + personScale.rangeBand() / 2 - 10;
        };
        var personBarYFunction = function( person ) {
            return timeScale( person.born );
        };
        var personBarHeightFunction = function( person ) {
            return timeScale( person.died || time.end ) -
                timeScale( person.born || time.start );
        };
        people.enter()
                .append( 'rect' )
                .attr( 'class', 'person' )
                .attr( 'x', personBarXFunction )
                .attr( 'y', personBarYFunction )
                .attr( 'height', personBarHeightFunction )
                .attr( 'width', Math.min( personScale.rangeBand(), 20 ) )
                .on( 'mouseenter', personTip.show )
                .on( 'mouseout', personTip.hide );
        people.exit().remove();
        people.call( personTip );
        people.transition()
            .duration( 500 )
            .attr( 'x', personBarXFunction )
            .attr( 'y', personBarYFunction )
            .attr( 'height', personBarHeightFunction )
            .attr( 'width', Math.min( personScale.rangeBand(), 20 ) );

        var getRelColor = function( idx ) {
            var colors = [
                '#ff0000', '#e59173', '#cad900', '#bfbfbf', '#005c73', '#a200f2',
                '#e50000', '#ff6600', '#b2ff80', '#666666', '#001b33', '#bf30b6'
            ];
            return colors[ idx % colors.length ];
        };

        var relTip = d3.tip()
            .attr( 'class', 'd3-tip' )
            .html( function( circle ) {
                return circle.rel.name;
            });

        var relations = frontLayer.selectAll( "g.relation" )
            .data( dataset.relations );
        var relationTransformFunction = function( rel ) {
            return 'translate(' + 
                   personScale.rangeBand() / 2 + ', ' +
                   timeScale( rel.date ) + ')';
        };
        relations.enter()
            .append( 'g' )
            .attr( 'class', 'relation' )
            .attr( 'transform', relationTransformFunction );
        relations.transition().attr( 'transform', relationTransformFunction );
        relations.exit().remove();

        var relCircles = relations.selectAll( "circle.relPerson" )
            .data( function( rel, i ) {
                return rel.parties.map( function( party ) {
                    return { party: party, idx: i, rel: rel };
                } );
            } );
        var relCirclesCXFunction = function( rel ) {
            return personScale( rel.party );
        };
        var relCirclesFillFunction = function( rel ) {
            return getRelColor( rel.idx );
        };
        relCircles.enter()
            .append( 'circle' )
                .attr( 'class', 'relPerson' )
                .attr( 'cx', relCirclesCXFunction )
                .attr( 'r', 16 )
                .attr( 'fill', relCirclesFillFunction )
                .on( 'mouseover', relTip.show )
                .on( 'mouseout', relTip.hide );
        relCircles.call( relTip );
        relCircles.transition()
            .attr( 'cx', relCirclesCXFunction )
            .attr( 'fill', relCirclesFillFunction );
        relCircles.exit().remove();

        var relLines = relations.selectAll( 'line.relHorizontal' )
            .data( function( rel, i ) {
                return [ { parties: rel.parties,
                           idx: i } ];
            } );
        var relLinesX1Function = function( rel ) {
            return Math.min.apply( null, rel.parties.map( personScale ) );
        };
        var relLinesX2Function = function( rel ) {
            return Math.max.apply( null, rel.parties.map( personScale ) );
        };
        var relLinesStrokeColorFunction = function( rel ) {
            return getRelColor( rel.idx );
        };
        relLines.enter()
            .append( 'line' )
                .attr( 'class', 'relHorizontal' )
                .style( 'stroke', relLinesStrokeColorFunction )
                .attr( 'x1', relLinesX1Function )
                .attr( 'x2', relLinesX2Function );
        relLines.transition()
            .attr( 'x1', relLinesX1Function )
            .attr( 'x2', relLinesX2Function );
        relLines.exit().remove();
        return this;
    };
    this.chart = chart;

    return this;
};

var chart;
$(document).ready(function() {
    chart = new Chart( 1500, 1500 )
        .updateData( bacon );

    d3.select( "#dataset-select" )
        .on( 'change', function() {
            var selection = d3.select( this ).property( 'value' );
            console.log( selection );
            chart.updateData( datasets[ selection ] );
        } );
});
