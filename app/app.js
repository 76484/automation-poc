const express = require('express');
const expressHandlebars  = require('express-handlebars');

const PARTNERS = {
    A: {
        partnerId: "A",
        name: "Partner A",
        hasDefaultAllInPricing: true
    },
    B: {
        partnerId: "B",
        name: "Partner B",
        hasDefaultAllInPricing: false
    }
}

const app = express();
const partner = PARTNERS[process.env.partner] || PARTNERS.A
const port = process.env.PORT || 3000;

app.engine('handlebars', expressHandlebars());
app.set('view engine', 'handlebars');

app.get('/', (_req, res) => {
    res.render('home', { partner });
});

app.get('/unauthorized', (_req, res) => {
    res.set('Content-Type', 'text/html');
    res.end('You are not authorized to view this page.');
});

app.listen(port, () => console.log(`Example app for partner ${partner.name} listening on port ${port}!`));
