///////////////////////////////////////////
// Composite
((window.$deferRun || function( run ){ run(); }) (
function( $, options ) {

	((window.$deferRun || function( run ){ run(); }) (
	function( $, options ) {
		window.testloaded.f = "";
		return options && options && options.myVal + ". File:  FED f";
	}));

	((window.$deferRun || function( run ){ run(); }) (
	function( $, options ) {
		window.testloaded.e = "";
		return options && options && options.myVal + ". File:  FED e";
	}));

	((window.$deferRun || function( run ){ run(); }) (
	function( $, options ) {
		window.testloaded.d = "";
		return options && options && options.myVal + ". File:  FED d";
	}));

}
));


