var kim = {
    people: [
        {
            'name': 'Kim',
            'born': 1980,
            'summary': "Kim Kardashian is famous for some reason... I'm not really sure why"
        },
        {
            'name': 'OJ Simpson',
            'born': 1947,
            "summary": "I think OJ played football in the 90's then killed his wife?"
        },
        {
            'name': 'Robert Kardashian',
            'born': 1944,
            'died': 2003,
            "summary": "Lawyer who represented OJ in his murder case then died"
        },
        {
            'name': 'Caitlyn Jenner',
            'born': 1949,
            "summary": "super famous olympic athlete in the 90s then transitioned to female"
        },
        {
            'name': 'Paris Hilton',
            'born': 1981,
            "summary": "Heiress of the Hilton hotel chains... famous party person in the early 2000s"
        },
        {
            'name': 'Ray J',
            'born': 1981,
            "summary": "famous rapper who had sex with Kim one time"
        },
        {
            'name': 'Kris Jenner',
            'born': 1955,
            "summary": "Kim's mom and Caitlyn's/Robert's ex-wife"
        }
    ],
    relations: [
        {
            'date': 1980,
            'parties': [
                'Kim', 'Robert Kardashian', 'Kris Jenner'
            ],
            'name': 'Kim born to Robert and Kris Kardashian'
        },
        {
            'date': 1978,
            'parties': [ 'Robert Kardashian', 'Kris Jenner' ],
            'name': 'Kris Jenner and Robert Kardashian marry'
        },
        {
            'date': 1991,
            'parties': [ 'Robert Kardashian', 'Kris Jenner' ],
            'name': 'Kris Jenner and Robert Kardashian divorce but remain friends'
        },
        {
            'date': 1991.2,
            'parties': [ 'Kris Jenner', 'Caitlyn Jenner' ],
            'name': 'Kris Jenner and Cairlyn (at the time Bruce) Jenner marry 1 month after divorce'
        },
        {
            'date': 2015,
            'parties': [ 'Kris Jenner', 'Caitlyn Jenner' ],
            'name': 'Kris Jenner and Caitlyn Jenner divorce'
        },
        {
            'date': 1994,
            'parties': [ 'Robert Kardashian', 'OJ Simpson' ],
            'name': 'Robert Kardashian represents OJ Simpson in OJs murder case'
        },
        {
            'date': 1996,
            'parties': [ 'OJ Simpson', 'Kim' ],
            'name': 'OJ Stays in Kim\'s room to avoid the media during his trial'
        },
        {
            'date': 2015,
            'parties': [ 'Caitlyn Jenner' ],
            'name': 'Caitlyn Jenner reveals her identity as a Trans Woman and changes her name from Bruce Jenner to Caitlyn Jenner'
        },
        {
            'date': 1979,
            'parties': [ 'Caitlyn Jenner' ],
            'name': 'Caitlyn Jenner (at the time Bruce Jenner) appears on the cover of playgirl, sports illustrated, and Gentleman\'s Quarterly magazine'
        },
        {
            'date': 2001,
            'parties': [ 'Kim', 'Paris Hilton' ],
            'name': 'Kim K is Paris Hilton\'s stylist <a href="http://www.thedailybeast.com/articles/2014/05/27/never-forget-kim-kardashian-s-days-as-paris-hilton-s-lowly-assistant.html">source</a>'
        },
        {
            'date': 2003,
            'parties': [ 'Kim', 'Ray J' ],
            'name': 'Sex Tape'
        }
    ]
};

var datasets = datasets || {};
datasets.kim = kim;
