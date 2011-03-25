///////////////////////////////////////////
// Composite
((window.$deferRun || function( run ){ run(); }) (
function( $, options ) {

	((window.$deferRun || function( run ){ run(); }) (
	function( $, options ) {
		window.testloaded.d = "";
		return options && options && options.myVal + ". File:  d";
	}));

	((window.$deferRun || function( run ){ run(); }) (
	function( $, options ) {
		window.testloaded.c = "";
		return options && options && options.myVal + ". File:  c";
	}));

	((window.$deferRun || function( run ){ run(); }) (
	function( $, options ) {
		window.testloaded.f = "";
		return options && options && options.myVal + ". File:  f";
	}));

},
{
	depends: "../folder1/a.js",
	contains: ["d", "c", "../f.js"],
	def: {
		c: "c.js",
		d: {
			url: "d.js",
			depends: "c"
		}
	}
}
));


