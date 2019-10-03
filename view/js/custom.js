(function () {
    "use strict";
    'use strict';


    var app = angular.module('viewCustom', ['angularLoad']);

    app.controller('GeoSearchController', ['angularLoad',  '$attrs', function (angularLoad, $attrs) {
      var vm = this;
      vm.$onInit=function() {
        angularLoad.loadCSS('https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css');        
        angularLoad.loadScript('https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.js').then(function() {
          mapboxgl.accessToken = $attrs.mapboxAccessToken;
          var map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v10'
          });
          // Add zoom and rotation controls to the map.
          map.addControl(new mapboxgl.NavigationControl());
          map.on('load', function () {
            map.loadImage('https://eu-st01.ext.exlibrisgroup.com/delivery/img/icon-poi.png', function(error, image) {
              if (error) throw error;
              map.addImage('poi', image);
              map.addLayer({
                "id": "points",
                "type": "symbol",
                "source": {
                  "type": "geojson",
                  "data": $attrs.geojsonUrl
                },
                "layout": {
                  "icon-image": "poi",
                  "icon-size": 1
                }
              });
            });

            // https://docs.mapbox.com/mapbox-gl-js/example/popup-on-hover/
            // Create a popup, but don't add it to the map yet.
            var popup = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false
            });
             
            map.on('mouseenter', 'points', function(e) {
              // Change the cursor style as a UI indicator.
              map.getCanvas().style.cursor = 'pointer';
               
              var coordinates = e.features[0].geometry.coordinates.slice();
              var description = e.features[0].properties.description;
               
              // Ensure that if the map is zoomed out such that multiple
              // copies of the feature are visible, the popup appears
              // over the copy being pointed to.
              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }
               
              // Populate the popup and set its coordinates
              // based on the feature found.
              popup.setLngLat(coordinates)
                .setHTML(description)
                .addTo(map);
            });
             
            map.on('mouseleave', 'points', function() {
              map.getCanvas().style.cursor = '';
              popup.remove();
            });  

            map.on('click', 'points', function (e) {
              var url = e.features[0].properties.url;
              if (url) window.open(url,'_blank'); 
            });   
          });          
        });
      };
    }]);

    app.component('geoSearch', {
      controller: 'GeoSearchController',
      template: `<div id="map"></div>`
    });

    /****************************************************************************************************/

        /*In case of CENTRAL_PACKAGE - comment out the below line to replace the other module definition*/

        /*var app = angular.module('centralCustom', ['angularLoad']);*/

    /****************************************************************************************************/

/*

*/

})();

   
