const express   = require('express');
const cors      = require('cors');
const nconf     = require('nconf');
const MongoClient = require('../utilities/mongodb.js');

const port = process.env.PORT || 3000;
const app = express();

nconf.env().file({ file: './config.json' });
var client;

app.use(cors());

app.get('/', (request, response) => {
  response.send('Hello!')
})

app.get('/geojson', async (request, response) => {
  var results = await client.find({});
  results = results.map(obj => {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: obj.gps.reverse()
      },
      properties: {
        title: obj.title,
        description: `<a href="${obj.viewer_url}"><div><strong>${obj.title}</strong><img src="${obj.thumbnail_url}"><span>${obj.label}</span></div></a>`,
        url: obj.viewer_url
      }
    }
  })
  response.send({
    type: "FeatureCollection",
    features: results
  });
})

app.listen(port, async (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  client = await new MongoClient(nconf.get('MONGODB_URI'), 'geosearch');   

  console.log(`server is listening on ${port}`)
})


