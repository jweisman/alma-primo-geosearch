# Alma Primo Geosearch
 
 Demo which includes the following:
 * Script to harvest records from Alma, extract GPS Exif information, and store the results in a MongoDB database
 * Service which returns the data from the database in GeoJSON format
 * Primo customized view which displays a map and the geo points returned by the GeoJSON service.
 
For more information refer to this [blog post](https://developers.exlibrisgroup.com/blog/implement-a-geo-search-widget-in-primo/).

## Configuration
Two sets of configuration are required. 

The harvest script and GeoJSON service depend on two environment variables:
* `OAI_URL`: The Alma OAI link from which to harvest the records
* `MONGODB_URI`: The connection string to connect to the MongoDB instance

The Primo view defines an AngularJS component called `geo-search` which exposes two attributes:
* `geojson-url`: The service which returns the GeoJSON data
* `mapbox-access-token`: The access token for the [MapBox SDK](https://mapbox.com). You can get a free access token at the MapBox website.

The `homepage_en.html` page in the Primo view includes the `geo-search` component as follows:
```
<geo-search geojson-url="https://alma-primo-geosearch.herokuapp.com/geojson" mapbox-access-token="pk.eyJ1IjoiandxxxxxxxxxGI3MiJ9.6CWm1uuxxxxxxynw"></geo-search>
```

## Running
To run the service, use `npm start`.

To run the harvest task, use `npm run harvest`.

## Deploy
You can use this button to deploy the app to Heroku. The deployment will add a MongoDB instance.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Use the Scheduler add-on to schedule the harvest script. In the Heroku web interface, select the Scheduler add-on. Then create a new job to run daily. For the Run Command, enter `npm run harvest`.
