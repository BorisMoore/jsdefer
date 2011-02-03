$deferRun( function($) {
	$deferRun( function() {
		
		// outer
		return $.template( "<li>${listName}</li>{{tmpl(array) '@inner'}}" );

	});

	$deferRun( function() {

		// inner
		return $.template( "<li>${firstName} ${lastName}</li>" );

	});

}, {
	contains: [ "outer", "inner" ]
});
