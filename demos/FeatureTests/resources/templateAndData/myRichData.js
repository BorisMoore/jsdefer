((window.$deferRun || function( run ){ run(); }) (

	function( $, options ) {
		return { array: 
			[
				{
					firstName: "Pete",
					lastName: "Henrikson",
					url: "http://www.google.com",
					cities: [
						"Seattle, WA",
						"San Francisco, CA"
					]
				},
				{
					firstName: "Rosa",
					lastName: "Almada",
					url: "http://www.google.com",
					cities: [
						"New York, NY"
					]
				}
			], 
			showCities: true,
			listName: "Customers" 
		};
	}

));
