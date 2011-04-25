// This is jquery.defer.js: The jQuery plugin version of JsDefer
// (If you want the jQuery-independent version of JsDefer, use JsDefer.js).

jQuery.defer || (function( $, window, undefined ) {

var document = window.document,
	anchor = document.createElement("a"),
	deferSettings, defer, ready, readyDefer,
	scriptByUrl = {},
	loadingScripts = [],
	loadingSubScripts;

function absUrl( basePath, url ) {
	if ( url.indexOf( "//" ) === -1 ) {
		url = basePath + url;
	}
	return anchor.href = url;
//	For IE without DOCTYPE - need use recursive regex along lines:	parts = url.split( "/../" ); parts[0] = parts[0].slice( 0, parts[0].lastIndexOf("/") + 1 ); Use recursive regex; return parts.join("").toLowerCase();
}

function getBasePath( url ) {
	return url.slice( 0, url.lastIndexOf("/") + 1 );
}

function makeArray( items ) {
	return typeof items === "string" ? [ items ] : items;
}

function normalize( items, basePath ) {
	if ( !items ) {
		return 0;
	}
	items = makeArray( items );
	var name, i = items.length;
	while ( i-- ) {
		name = items[ i ];
		if ( !defer[ name ] ) {
			items[ i ] = absUrl( basePath, name );
		}
	}
	return items;
}

function getScriptDef( name, thisUrl ) {
	var thisUrlKey,
		scriptDef = defer[ name ];

	if ( scriptDef ) {
		return scriptDef;
	}

	thisUrl = absUrl( getBasePath( thisUrl || "" ), name );
	thisUrlKey = thisUrl.toLowerCase();
	return scriptByUrl[ thisUrlKey ] || (scriptByUrl[ thisUrlKey ] = { url: thisUrl });
}

$.extend({
	defer: function( scriptName, options, basePath ) {
		options = options || {};

		var i, readyName, asyncLoad, result, prevPromise,
			runWait = 0,
			delayDomReady = options.delayDomReady || deferSettings.delayDomReady,
			min = options.min || deferSettings.min,
			scriptDef = getScriptDef( scriptName, basePath ),
			url = scriptDef.url,
			loadUrl = ( min && scriptDef.minUrl ) || scriptDef.url,

			settings = $.extend( scriptDef, options ),
			bare = settings.bare,
			contains = settings.contains,
			loaded = settings.loaded,
			depends = settings.depends,
			multiple = settings.multiple,

			parentPromise = scriptDef.prntPrms,
			promise = scriptDef.promise,
			runCb, thisPromise, hasRun, hasRunPromise;

		function run() {
			var i, thisRunCb = runCb || scriptDef.runCb; // For multiple or composite scripts, callback was passed via scriptDef

			if ( !(runWait--) ) {
				if ( !asyncLoad.isRejected() ) {
					if ( parentPromise ) {
						asyncLoad.resolve(
							result ||
							(scriptDef.result = result = thisRunCb.call( promise, $, options ))
						);
					} else if ( contains ) {
						loadingSubScripts = [];

						thisRunCb.call( promise, $, options );

						i = contains.length;

// The following lines could be in debug build only...
//if ( loadingSubScripts.length !== i ) {
//	throw url; //script definition error - number of contained scripts not equal to contains array length.
//}
 						while ( i-- ) {
							getScriptDef( contains[ i ], url ).runCb = loadingSubScripts[ i ].run;
						}
						loadingSubScripts = 0;

						hasRun.resolve();

						loadDependencies( contains, [], function() {
							i = contains.length;
 							result = [];
							while ( i-- ) {
								result.push( getScriptDef( contains[ i ], url ).result );
							}
							asyncLoad.resolve( result );
						});
					} else {
						asyncLoad.resolve(
							result ||
							(scriptDef.result = result = bare ? "bare" : thisRunCb.call( promise, $, options ))
						);
					}
					result = multiple ? 0 : result;
				}
				if ( delayDomReady ) {
					ready( true );
				}
			}
		}

		function reject() {
			asyncLoad.reject( "fail", url );
		}

		function loadDependencies( newDepends, promises, cb ) {
			promises = promises || [];
			var i = newDepends && newDepends.length;
			while ( i-- ) {
				promises.push( defer( newDepends[ i ], options, url ));
			}
			$.when.apply( $, promises ).fail( reject ).done( cb || run );
		}

		function getScript() {
			return $.ajax({
					url: loadUrl,
					dataType: "script",
					timeout: settings.timeout,
					cache: !settings.noCache,
					crossDomain: true // Force regular script insertion, rather than XMLHTTP plus script insertion in document, for easier debugging.
				})

				.fail( reject )

				// readyStateChange complete has happened
				.done( function() {

					var deferRunSettings = bare ? 0 : loadingScripts.shift();

					if ( !deferRunSettings ) {
						if ( !bare ) {
							// 404 or similar - no script got loaded for this url.
							// This only works for IE. For Chrome and FF, neither done nor fail cb of $.ajax get called for 404.
							// Set timeout to get error for all browsers.
							reject();
						}
						// Non-wrapped script
						run();
						return;
					}

					runCb = scriptDef.runCb = deferRunSettings.run;

					if ( deferRunSettings.def ) {
						$.deferDef( deferRunSettings.def, url );
					}

					depends = makeArray( deferRunSettings.depends ) || [];
					prepareSubDefs( !contains && deferRunSettings.contains )

					if ( depends.length ) {
						runWait++;
						loadDependencies( depends );
					}
				});
		}

		function prepareSubDefs( containNames ) {
			if ( containNames ) {
				hasRun = $.Deferred();
				hasRunPromise = [ hasRun.promise() ];
				contains = makeArray( containNames );
				i = contains.length;
				while ( i-- ) {
					getScriptDef( contains[ i ], url ).prntPrms = hasRunPromise;
				}
			}
		}

		if ( multiple || !promise ) {
			asyncLoad = $.Deferred();

			if ( loaded && eval( loaded ) ) {
				return asyncLoad.resolve().promise();
			}

			if ( delayDomReady ) {
				$.readyWait++;
			}

			prevPromise = promise;
			asyncLoad = $.Deferred();
			promise = scriptDef.promise = asyncLoad.promise();

			if ( bare ) {
				loadDependencies( depends, 0, getScript );
			} else if ( prevPromise ) {
				// This is a subsequent call, with multiple = true;
				loadDependencies( 0, [ prevPromise ]);
			} else if ( parentPromise ) {
				loadDependencies( depends, parentPromise );
			} else {
				prepareSubDefs( contains );

				loadDependencies( depends, [ getScript().promise() ] );
			}
		}
		if ( readyName = options.readyName || scriptDef.name ) {
			ready[ readyName ] = promise;
		}
		return promise;
	},

	deferDef: function( scriptDefs, thisUrl ) {
		var scriptName, basePath, scriptDef,
			scriptEl = document.getElementsByTagName( "script" );

		function defineScript( name, newScriptDef ) {
			// Autogenerate methods on defer for registered scripts.
			if ( typeof newScriptDef === "string" ) {
				newScriptDef = { url: newScriptDef };
			}

			var minUrl = newScriptDef.minUrl,
				url = absUrl( basePath, newScriptDef.url ),

//			May be some issues in Chrome. Investigate:
//			scriptDef = scriptByUrl[ url ];
//			// Autogenerate methods on defer for registered scripts.
//			if ( !scriptDef ) {
//				scriptDef = function() {
//					var args = array.prototype.slice.call( arguments, 0 );
//					args.unshift( name );
//					return defer.apply( $, args );
//				}
//			}

				// Autogenerate methods on defer for registered scripts.
				scriptDef = scriptByUrl[ url ] || function() {
					var args = Array.prototype.slice.call( arguments, 0 );
					args.unshift( name );
					return defer.apply( $, args );
				};

			newScriptDef.url = url;
			if ( minUrl ) {
				newScriptDef.minUrl = absUrl( basePath, minUrl );
			}

			$.extend( scriptDef, newScriptDef );

			scriptByUrl[ url ] = defer[ name ] = scriptDef;
			scriptDef.name = name;
		}

// This if fine for static scripts and inline script, but will not find the correct script element, in the case of dynamically loaded scripts.
// So we require define to be loaded statically or in the page.
// But can pass a definition to run, in dynamically loaded pages - and use thisUrl.

		scriptEl = scriptEl[ scriptEl.length-1 ];
		basePath = getBasePath( thisUrl || scriptEl.src );

		if ( typeof scriptDefs === "string" ) {
			// Calling $.deferDef( nameOrAbsoluteUrlOrRelativeUrl) will return the scriptDef object
			return defer[scriptDefs ] || scriptByUrl[ absUrl( basePath, scriptDefs )];
		}

		for ( scriptName in scriptDefs ) {
			defineScript( scriptName, scriptDefs[ scriptName ] );
		}
		for ( scriptName in scriptDefs ) {
			scriptDef = getScriptDef( scriptName );
			scriptDef.depends = normalize( scriptDef.depends, basePath );
			scriptDef.contains = normalize( scriptDef.contains, basePath );
		}
	},

	deferSettings: {
		delayDomReady: false,
		min: true
	}
});

window.$deferRun = function( run, settings ) {
	settings = makeArray( settings );
	settings = settings && settings.length ? { depends: settings } : settings || {};
	settings.run = run;

	( loadingSubScripts || loadingScripts ).push( settings );
};

deferSettings = $.deferSettings;
defer = $.defer;
ready = $.ready;

readyDefer = $.Deferred();
readyDefer.promise( ready );

// Workaround, to expose domReady promise
// (only needed because the Dom Ready promise is not exposed by core).
$( function() {
	readyDefer.resolve();
});

})( jQuery, window );


// TODO Add CSS loader support
//
//function loadStyles( src ) {
//	var styles = document.createElement("link");
//	styles.href = src.indexOf("http") === 0 ? src : basePath + src;
//	styles.rel = "stylesheet";
//	styles.type = "text/css";
//	head.appendChild( styles );
//}
