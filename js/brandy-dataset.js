var brandy = {
    people: [
        {
            'name': 'Brandy Norwood',
            'born': 1979,
            'summary': 'Brandy Norwood is a music celebrity for some reason'
        },
        {
            'name': 'Whitney Houston',
            'born': 1963,
            'died': 2012,
            'summary': 'American singer, actress, producer, and model.  Houston is one of the best selling music artists of all time'
        },
        {
            'name': 'Ray J',
            'born': 1981,
            'summary': 'American Hip Hop artist who made a sex tape with Kim K'
        }
    ],
    relations: [
        {
            'date': 1981,
            'parties': [
                'Brandy Norwood', 'Ray J'
            ],
            'name': 'Ray J is Brandy Norwood\'s older sister'
        }
    ]
};

var datasets = datasets || {};
datasets.brandy = brandy;
