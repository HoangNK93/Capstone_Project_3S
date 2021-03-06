



var Q = require('q');

var GoogleMapsAPI = require('googlemaps');

var config = {
	// key: 'AIzaSyALajTCGOGkS_TZBAXyUkjtWdSk5t4TIyY',	// Server key
	key: 'AIzaSyAj3vEJVfSLqDLUO5UMPBAm3IN8gUPh5Og',
	secure: true
};

var gmAPI = new GoogleMapsAPI(config);


var api = {};

api.getDistanceFromOneToMany = function(origin, destinations) {
	var originString = '',
		destinationsString = '';
	
	originString = origin.latitude + ',' + origin.longitude;
	destinations.forEach(function(dest, index) {
		if (index > 0) destinationsString += '|';
		destinationsString += dest.latitude + ',' + dest.longitude;		
	});

	var request = {
        origins: originString,
        destinations: destinationsString,
        mode: 'driving',        
        units: 'metric',
        language: 'en'
	};

	var d = Q.defer();
	gmAPI.distance(request, function(err, response) {	
		if (err) {
			d.reject(err);			
		} else {
			if (response.status === 'OK') {
				console.log('response', response.rows);
				var results = response.rows[0].elements.map(function(element, index) {
						return {
							distance: element.distance,
							duration: element.duration,
							id: index
						};
		        });
	            d.resolve(results);
			} else {			
				d.reject(response.status + ': ' + response.error_message);
			}
		}
	});
	return d.promise;
};

api.getClosestShippers = function(store, shippers, filter) {
	// filter shippers by status

	console.log('validShippers', shippers);

	var validShippers = shippers.filter(function(shipper) {
		return (shipper.isConnected === filter.isConnected && shipper.haveIssue === filter.haveIssue && shipper.numTasks < filter.maxTasks);
	});	

	return api.getDistanceFromOneToMany(store, validShippers)
	.then(function(results) {
		// filter by radius
		results = results.filter(function(e) {
			return e.distance.value <= filter.radius;
		});

		// sort ascending by distance
		results = results.sort(function(e1, e2) {
			return e1.distance.value < e2.distance.value;
		});
				
		// get smallest distances
		results = results.slice(0, filter.limit);

		// convert to shipper id
		results = results.map(function(e) {
			return {
				shipperID: validShippers[e.id].shipperID,
				distanceText: e.distance.text,
				durationText: e.duration.text
			};
		});		
		
		return results;
	})
	.catch(function(err) {
		console.log('getClosestShippers error', err);
	});
};

/*
	Input: geoText (String)
	Output: Promise({
		latitude: double
		longitude: double
	})
*/
api.getLatLng = function(geoText) {
    var d = Q.defer();
    gmAPI.geocode({
        address: geoText
    }, function(err, response) {
        if (err) {
			d.reject(err);			
		} else {
			if (response.status === 'OK') {
				//console.log('getlatlng', response.results[0].geometry);
				d.resolve({
	                latitude: response.results[0].geometry.location.lat,
	                longitude: response.results[0].geometry.location.lng
	            });
			} else {			
				d.reject(response.status + ': ' + response.error_message);
			}
		}
    });

    return d.promise;
};

api.getGeoText = function(latitude, longitude) {
	var latlng = latitude + ',' + longitude;
	var d = Q.defer();
    gmAPI.reverseGeocode({
        latlng: latlng
        // location_type: 'APPROXIMATE'
    }, function(err, response) {
        if (err) {
			d.reject(err);			
		} else {
			if (response.status === 'OK') {
				//console.log('getlatlng', response.results[0].geometry);
				var geoText = 'Not Available';
				if (response.results[0]) {
					geoText = response.results[0].formatted_address;
				}
    			d.resolve(geoText);
			} else {			
				d.reject(response.status + ': ' + response.error_message);
			}
		}
    });

    return d.promise;
};

module.exports = api;           