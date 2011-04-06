((window.$deferRun || function( run ){ run(); }) (

function( $, options ) {

	window.testloaded.a = "";
	if ( $ ) {
		return options && options.myVal + ". File:  a";
	}

}

//);
));
