((window.$deferRun || function( run ){ run(); }) (
//$deferRun( 

function( $, options ) {

	window.testloaded.a = "";
	if ( $ ) {
		return options && options.myVal + ". File:  a";
	}

}

//);
));
