$deferRun( function($) {
	$deferRun( function() {

		// outer
		return $.template( "<li><a href='${url}'>${firstName} ${lastName}</a></li><li><i>Cities:</i></li>{{tmpl(cities) '@inner'}}" );

	});

	$deferRun( function() {

		// inner
		return $.template( "<li>${$data}</li>" );

	});

});
