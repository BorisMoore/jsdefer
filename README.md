# JsDefer Features:

* Wrapped scripts
* Unwrapped scripts
* Optional script definition (deferDef) defines dependencies
* Optional deferring of DomReady at global or individual request level
* Can also add dependencies for script - or add new  definitions - in the script itself, if wrapped
* Execution order based on dependency
* Parallel/serial loading based on definitions, dependency, and wrapped versus unwrapped, and whether
    dependencies are defined in separate def file or in script itself.
* Passing options to scripts
* Wrapped script can provide a return value
* Failure bubbling
* Integration with Deferred (as in jQuery 1.5) enables or simplifies many use-case scenarios
* Use of $,when and other deferred features: `when( scripts, json, domReady ).then( myCallback );`
* Exposing 'promises' (named deferreds)
* Setting: min true/false, for debug versus minified versions
* Wrapped scripts 'self executing' when used as static scripts
* Composite scripts (also able to be loaded statically in page)
* jQuery independent version
* Small

## Demos

### Complete Demos
* Different versions of the [Movies Demo app](https://github.com/BorisMoore/JsDefer/tree/master/demos/Movies/pages)
are provided to illustrate different use scenarios for JsDefer.

### Feature tests:

* Basic Features: Currently no unit tests are provided (they will come) but the
[FeatureTests/Basic](https://github.com/BorisMoore/JsDefer/tree/master/demos/FeatureTests/Basic)
folder provides some examples for testing different feature details.
* Advanced Features:
[This folder](https://github.com/BorisMoore/JsDefer/tree/master/demos/FeatureTests/WithOrWithoutJQuery)
shows how to use JsDefer with or without jQuery.
[These samples](https://github.com/BorisMoore/JsDefer/tree/master/demos/FeatureTests/Advanced)
illustrate some less-commonly used features.
The [AsyncTemplates](https://github.com/BorisMoore/JsDefer/tree/master/demos/FeatureTests/Advanced/AsyncTemplates)
folder explores some experimental integration with
[jQuery Templates](https://github.com/jquery/jquery-tmpl).


## Syntax Examples:


### Request deferred script loading

	// Note: If scripts have been defined in a deferDef declaration, this will
	// trigger parallel loading of all dependent scripts,
	// and will execute scripts in the correct order

	// Load movies script
	$.defer( "...movieApp.js" )
		.done( workWithMovies )
		.fail( failCallback );


### Deferred script loading using delayed DomReady event

	$.deferSettings.delayDomReady = true;

	$.defer( "...movieApp.js" );

	$( function() {
		workWithMoviesAndDom();
	});


### Passing options and using return value

	$.defer( "...movieApp.js", { pageSize: 4 })
		.done( function( movieApp ) {
			workWithMovies( movieApp );
		});


### Using $.when to handle parallel async processes

	// Load both data and scripts in parallel,
	// and process when data, scripts and DOM are ready
	$.when(
		$.defer( "...movieApp.js", { pageSize: 4 } ),
		getMovies( "Cartoons" ),
		$.ready
	)
	.done( function( movieApp, data ) {
		workWithMoviesAndDom( movieApp );
	});


### Setting default options

	// Use unminified versions of script
	$.deferSettings.min = false;

	// Delay DomReady by default. (Can also override as a setting, for individual defer() requests.)
	$.deferSettings.delayDomReady = true;


### Create deferDef definition - to load and execute dependencies in correct order

	$.deferDef({
		// Just set the URL
		tmpl: "http://...jquery.tmpl.js",

		// Specify url and dependencies
		tmplPlus: {
			url: "http://.../jquery.tmplPlus.js",
			depends: "tmpl"
		},

		tmplCombined: {
			url: "myCombinedFiles/tmplCombined.js",

			// This script has both minified and unminified versions
			urlMin: "myCombinedFiles/tmpl.min.js",

			// It is a combined script: it can be used in place of the tmpl and tmplPlus scripts
			contains: [ "tmpl", "tmplPlus" ]
		},

		yahooHelper: {
			url: "http://.../yahooHelper.js",

			// This script is not wrapped, and therefore will load sequentially after its dependencies:
			// i.e. it will only be requested after any script that it depends on has loaded and executed
			bare: true,
		},

		movieApp: {
			url: "movieApp.js",

			// Note that this script is wrapped (default is bare: false), and so will be loaded in parallel along
			// with its dependencies. However its contents will not be executed until after execution of dependent scripts.

			// Depends on both a declared and undeclared scripts
			depends: [ "tmplPlus", "http://...datamodel.js", "yahooHelper" ]
		}

	});

	// Can optionally use typed methods to do a deferred load of any resource script defined in
	// the deferDef definition (plus its dependencies):

	$.defer.movieApp()
		.done( workWithMovies )
		.fail( failCb );


### Wrapped script

_Note:_ This can be loaded by any script loader that recognizes
the $deferRun global name for the wrapper function.

	$deferRun(

	function( $, options ) {

		// Script code here
		doStuff( options );
		return myObject;

	}

	);


### Self-executing wrapper

_Use this wrapper syntax to create a wrapped script which can also be loaded as a static script
 in the absence of a script loader recognizing the $deferRun wrapper function_

	((window.$deferRun || function( run ){ run(); }) (

	function( $, options ) {

		// Script code here

	}

	));


### Declare dependencies on script itself

_Note:_ If the dependent script was already declared in a deferDef definition, then
it will have loaded in parallel. Otherwise, if only declared here, it will be loaded
in series - after this script loads, but before the body of this script is executed.

	((window.$deferRun || function( run ){ run(); }) (

	function( $, options ) {

		// Script code here

	},

	// Declare one or more dependent scripts
	"myOtherCode.js"

	));


### Declare dependencies and a deferDef definition, on the script itself

	((window.$deferRun || function( run ){ run(); }) (

	function( $, options ) {

		// Script code here

	},
	{
		// Declare one or more dependent scripts
		depends: ["...myOtherCode.js", "myComponent"],

		// Declare some deferDer script definitions
		def: {
			myComponent: {
				url: "...myComponent.js",
				minUrl: "...myComponent.min.js",
				depends: "...componentCore.js"
			}
		}
	}));


### Script combination: Composite scripts

The different wrapped scripts within this script are identical to the
individual wrapped scripts that they replace.

_tmplCombined.js:_

	$deferRun(
	function( $, options ) {

		$deferRun(
		function( $, options ) {
			// Script code for tmpl.js here
		});

		$deferRun(
		function( $, options ) {
			// Script code for tmplPlus here
		});

	});

_Associated script definition, and invocation_

	$.deferDef({
		tmplCombined: {
			url: "myCombinedFiles/tmplCombined.js",

			contains: [ "http://...tmpl.js", "http://...tmplPlus.js" ]
		}
	});

	$.defer.tmplCombined();

	// Note: The above will make one HTTP request for the composite file,
	// but is otherwise equivalent to the following two requests:

	//$.defer( "http://...tmpl.js" );
	//$.defer( "http://...tmplPlus.js" );

	// The individual wrapped scripts will execute in the correct order based on the
	// declared dependencies of the individual scripts files they represent,
	// but the individual files will not be loaded, once the composite
	// script has been requested.


### Can also declare deferDef script definitions, dependencies, etc. on the composite file itself

	$deferRun(

	function( $, options ) {

		$deferRun(
		function( $, options ) {
			// Script code for sub script 1 here
		});

		$deferRun(
		function( $, options ) {
			// Script code for sub script 2 here
		});

	},
	{
		depends: [ "...OtherCode.js", "foo" ],
		def: {
			myVal: {
				url: "...foo.js",
				minUrl: "...foo.min.js",
				depends: "...fooCore.js"
			}
		}
	}

	);


### Self-executing composite script

_Use the following wrapper syntax to create a composite
 script that can also be loaded statically_

_Note:_ if loaded statically, the individual wrapped scripts
will execute in document order

		((window.$deferRun || function( run ){ run(); }) (
		function( $, options ) {

			((window.$deferRun || function( run ){ run(); }) (
			function( $, options ) {
				// Script code for sub script 1 here
			}));

			((window.$deferRun || function( run ){ run(); }) (
			function( $, options ) {
				// Script code for sub script 2 here
			}));

			((window.$deferRun || function( run ){ run(); }) (
			function( $, options ) {
				// Script code for sub script 3 here
			}));

		}));



### App example:

#### Inline deferDef
#### Delayed DomReady

	<script src="../../jQueryUI/jQueryUiDefs.js" type="text/javascript"></script>

	<script type="text/javascript">

	var movieApp = { pageSize: 4 };

	// Declare inline deferDef script definition, in addition to static jQueryUiDefs.js file above
	$.deferDef({
		tmpl: "http://...jquery.tmpl.js",
		tmplPlus: {
			url: "http://.../jquery.tmplPlus.js",
			depends: "tmpl"
		},
		movies: {
			url: "movies.js",
			depends: "tmplPlus"
		}
	});

	$.deferSettings.delayDomReady = true;

	// Load and execute all required scripts:
	$.defer.movies();
	$.defer.datePicker();

	// Use delayed DomReady event to use loaded scripts and access DOM
	$( function() {
		$.movies( movieApp );
		movieApp.getMovies( 0, "Cartoons" )
			.done( function( data ) {
				movieApp.render( data );
				$( "#genres li" ).click( movieApp.selectGenre );
			});


## App example:

#### Parallel loading of data and scripts
#### Using $.when to access scripts, data and DOM

	<script src="../../jQueryUI/jQueryUiDefs.js" type="text/javascript"></script>
	<script src="../../MovieAppDefs.js" type="text/javascript"></script>

	<script type="text/javascript">

	// Load and execute all required scripts, and fetch data
	// Use loaded scripts and data, and access DOM
	$.when(
		$.defer.movies({ pageSize: 4 }),
		getMovies( 0, "Cartoons" ),
		$.defer.datePicker(),
		$.ready
	)
	.done( function( movieApp, data ) {
		movieApp.render( data );
		$( "#genres li" ).click( movieApp.selectGenre );



## App example:

#### Lazy loading of scripts and data

	<script src="../../jQueryUI/jQueryUiDefs.js" type="text/javascript"></script>
	<script src="../../MovieAppDefs.js" type="text/javascript"></script>

	<script type="text/javascript">

	$( function() {

		$("#loadApp").click( function() {
			// Only load the scripts and data if the user clicks on this button.
			$.when(
				$.defer.movies({ pageSize: 4 }),
				getMovies( 0, "Cartoons" ),
				$.defer.datePicker()
			)
			.done( function( movieApp, data ) {
				movieApp.render( data );
				$( "#genres li" ).click( movieApp.selectGenre );