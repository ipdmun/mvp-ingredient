
const https = require('https');
const url = "https://docs.google.com/spreadsheets/d/1h3D23gIZrB11MVEfPIN9ii-44EE19u0-IP51epRENpc/export?format=csv";

function fetch(link) {
    https.get(link, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            console.log("Redirecting to: " + res.headers.location);
            fetch(res.headers.location);
            return;
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => console.log(data));
    }).on('error', (err) => {
        console.error("Error: " + err.message);
    });
}

fetch(url);
