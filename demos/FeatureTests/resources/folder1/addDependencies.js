((window.$deferRun || function( run ){ run(); }) (

	function( $, options ) {
		window.testloaded.addDependencies = "";
		return options && options && options.myVal + ". File:  addDependencies";
	},

	{
		depends: "c",
		def: {
			c: {
				url: "../folder2/c.js",
				depends: "d"
			},
			d: "../folder2/d.js"
		}
	}

));
