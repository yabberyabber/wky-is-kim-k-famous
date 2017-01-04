var UserInput = function ( chart ) {
    var form = d3.select( 'body' ).append( 'div' )
        .attr( 'class', 'userInput' );

    form.append( 'h2' ).text( 'People' );
    var peopleContainer = form.append( 'div' );

    form.append( 'h2' ).text( 'Events' );
    var eventsContainer = form.append( 'div' );

    this.updateData = function( dataset ) {
        var people = peopleContainer.selectAll( 'div.personForm' ).data( dataset.people );
        var personFormHtml = ( person, idx ) => {
            return "Name <input type='text' value='" + person.name +
                        "' class='personName-" + idx + "' />" +
                "Birth <input type='text' value='" + person.born +
                        "' class='personBirth-" + idx + "' />" +
                "Death <input type='text' value='" + person.died +
                        "' class='personDeath-" + idx + "' /><br />" +
                "Summary <textarea rows='5' cols='80' class='personSummary-" +
                        idx + "'>" + person.summary + "</textarea><br />" + 
                "<input type='submit' value='Delete' class='personDeleteBtn' />" +
                "<input type='submit' value='Update' class='personUpdateBtn' />" +
                "<br /><br />";
        };
        var personFormDeleteOnclick = ( _, __, idx ) => {
            dataset.people.splice( idx, 1 );
            updateData( dataset );
        };
        var personFormUpdateOnclick = ( _, __, idx ) => {
            dataset.people[ idx ] = {
                name: d3.select( '.personName-' + idx ).value(),
                born: d3.select( '.personBirth-' + idx ).value(),
                died: d3.select( '.personDeath-' + idx ).value(),
                summary: d3.select( '.personSummary-' + idx ).value()
            };
            updateData( dataset );
        };
        people.enter().append( 'div' ).html( personFormHtml );
        people.selectAll( 'div' ).transition().html( personFormHtml );
        people.selectAll( 'input.personDeleteBtn' ).on( 'click', personFormDeleteOnclick );
        people.selectAll( 'input.personUpdateBtn' ).on( 'click', personFormUpdateOnclick );
        people.exit().remove();
    };

    this.form = form;
    this.peopleContainer = peopleContainer;
    this.eventsContainer = eventsContainer;
    return this;
};
