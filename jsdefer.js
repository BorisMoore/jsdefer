// This is jsdefer.js: The jQuery-independent version of JsDefer
// (If you want the jQuery plugin version of JsDefer, use jquery.defer.js).

window.jsDefer || window.jQuery && jQuery.defer || (function( window, undefined ) {

var $, document = window.document,
	anchor = document.createElement("a"),
	deferSettings, defer, deferDef, ready, readyList,
	scriptByUrl = {},
	loadingScripts = [],
	loadingSubScripts,
	promiseMethods = "then done fail isResolved isRejected promise".split( " " ),
	slice = Array.prototype.slice;

if ( window.jQuery ) {
	////////////////////////////////////////////////////////////////////////////////////////////////
	// jQuery is loaded, so make $ the jQuery object
	$ = jQuery;

	// Workaround, to expose domReady promise. (Only needed because the Dom Ready promise is not exposed by core).
	$( function() {
		readyList.resolveWith( document , [ $ ] );
	});

} else {
	////////////////////////////////////////////////////////////////////////////////////////////////
	// jQuery is not loaded. Make $ the jsDefer object

	// Use a 'clone' of the implementation of Deferred from jQuery-1.5.js
	// to provide identical Deferred APIs and behavior to jQuery.

	// Also provide simplified support for $.extend, DomReady and AJAX x-domain requests,
	// since we can't use jQuery implementations of those...

	window.jsDefer = window.$ = $ = function( cb ) {
		return readyList.done( cb );
	};

	$.extend = function( target, source ) {
		if ( source === undefined ) {
			source = target;
			target = $;
		}
		for ( var name in source ) {
			target[ name ] = source[ name ];
		}
		return target;
	};

	$.extend({
		readyWait: 1,

		ready: function( wait ) {
			// A third-party is pushing the ready event forwards
			if ( wait === true ) {
				$.readyWait--;
			}
			if ( !$.readyWait || (wait !== true && !$.isReady) ) {
				readyList.resolveWith( document , [ $ ] );
			}
		},

		isFunction: function( elem ) {
			return typeof elem === "function";
		},

		// Create a simple deferred (one callbacks list)
		_Deferred: function() {
			var // callbacks list
				callbacks = [],
				// stored [ context , args ]
				fired,
				// to avoid firing when already doing so
				firing,
				// flag to know if the deferred has been cancelled
				cancelled,
				// the deferred itself
				deferred  = {

					// done( f1, f2, ...)
					done: function() {
						if ( !cancelled ) {
							var args = arguments,
								i,
								length,
								elem,
								type,
								_fired;
							if ( fired ) {
								_fired = fired;
								fired = 0;
							}
							for ( i = 0, length = args.length; i < length; i++ ) {
								elem = args[ i ];
								if ( elem instanceof Array ) {
									deferred.done.apply( deferred, elem );
								} else if ( $.isFunction( elem )) {
									callbacks.push( elem );
								}
							}
							if ( _fired ) {
								deferred.resolveWith( _fired[ 0 ], _fired[ 1 ] );
							}
						}
						return this;
					},

					// resolve with given context and args
					resolveWith: function( context, args ) {
						if ( !cancelled && !fired && !firing ) {
							firing = 1;
	//						try {
								while( callbacks[ 0 ] ) {
									callbacks.shift().apply( context, args );
								}
	//						}
	//						finally {
								fired = [ context, args ];
								firing = 0;
	//						}
						}
						return this;
					},

					// resolve with this as context and given arguments
					resolve: function() {
						deferred.resolveWith( $.isFunction( this.promise ) ? this.promise() : this, arguments );
						return this;
					},

					// Has this deferred been resolved?
					isResolved: function() {
						return !!( firing || fired );
					},

					// Cancel
					cancel: function() {
						cancelled = 1;
						callbacks = [];
						return this;
					}
				};

			return deferred;
		},

		// Full fledged deferred (two callbacks list)
		Deferred: function( func ) {
			var deferred = $._Deferred(),
				failDeferred = $._Deferred(),
				promise;
			// Add errorDeferred methods, then and promise
			$.extend( deferred, {
				then: function( doneCallbacks, failCallbacks ) {
					deferred.done( doneCallbacks ).fail( failCallbacks );
					return this;
				},
				fail: failDeferred.done,
				rejectWith: failDeferred.resolveWith,
				reject: failDeferred.resolve,
				isRejected: failDeferred.isResolved,
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj , i /* internal */ ) {
					if ( obj == null ) {
						if ( promise ) {
							return promise;
						}
						promise = obj = {};
					}
					i = promiseMethods.length;
					while( i-- ) {
						obj[ promiseMethods[ i ] ] = deferred[ promiseMethods[ i ] ];
					}
					return obj;
				}
			} );
			// Make sure only one callback list will be used
			deferred.then( failDeferred.cancel, deferred.cancel );
			// Unexpose cancel
			delete deferred.cancel;
			// Call given func if any
			if ( func ) {
				func.call( deferred, deferred );
			}
			return deferred;
		},

		// Deferred helper
		when: function( object ) {
			var index,
				args = arguments,
				length = args.length,
				deferred = length <= 1 && object && $.isFunction( object.promise ) ?
					object :
					$.Deferred(),
				promise = deferred.promise(),
				resolveArray;

			if ( length > 1 ) {
				resolveArray = new Array( length );
				for ( index = 0; index < length; index++ ) {
						$.when( args[index] ).then( function( value ) {
							resolveArray[ index ] = arguments.length > 1 ? slice.call( arguments, 0 ) : value;
							if( ! --length ) {
								deferred.resolveWith( promise, resolveArray );
							}
						}, deferred.reject );
					}
			} else if ( deferred !== object ) {
				deferred.resolve( object );
			}
			return promise;
		}
	});

	function getAjax( options ) {
		var deferred = $.Deferred(),
 			head = document.getElementsByTagName( "head" )[ 0 ] || document.documentElement,
			script = document.createElement( "script" );

		script.src = options.url;

		// TODO? Add support for timeout and cache

		script.onload = script.onreadystatechange = function() {
			if ( !script.readyState || /loaded|complete/.test( script.readyState ) ) {
				// Handle memory leak in IE
				script.onload = script.onreadystatechange = null;
				if ( head && script.parentNode ) {
					head.removeChild( script );
				}

				// Dereference the script
				script = undefined;

				deferred.resolve();
			}
		};
		head.insertBefore( script, head.firstChild );
		return deferred;
	};

	function domReady() {
		if ( !document.body ) {
			return setTimeout( function() {
				domReady();
			}, 1 );
		}
		$.isReady = true;
		ready( true );
	}
	domReady();
}


////////////////////////////////////////////////////////////////////////////////////////////////
// The following code is identical to the corresponding code in jquery.defer.js

function absUrl( basePath, url ) {
	if ( url.indexOf( "://") === -1 ) {
		url = basePath + url;
	}
	anchor.href = url;
	return anchor.href.toLowerCase();
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
	var scriptDef = defer[ name ];
	if ( scriptDef ) {
		return scriptDef;
	}

	thisUrl = absUrl( getBasePath( thisUrl || "" ), name );

	return scriptByUrl[ thisUrl ] || (scriptByUrl[ thisUrl ] = { url: thisUrl });
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
			// Use $.ajax if jQuery is loaded. Otherwised use our stripped down getAjax call.
			return ($.ajax || getAjax)({
					url: loadUrl,
					dataType: "script",
					timeout: options.timeout,
					cache: !options.noCache,
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
						if ( jQuery && $ !== jQuery ) {
							// Special case: jQuery has been loaded dynamically by JsDefer, so switch to plugin version of JsDefer
							$ = jQuery.extend({
								defer: defer,
								deferSettings: deferSettings,
								deferDef: deferDef
							});
						}
						run();
						return;
					}

					runCb = scriptDef.runCb = deferRunSettings.run;

					if ( deferRunSettings.def ) {
						deferDef( deferRunSettings.def, url );
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

			if ( loaded && eval( loaded )) {
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
				loadDependencies( depends, [ prevPromise ]);
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
					var args = slice.call( arguments, 0 );
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
deferDef = $.deferDef;
ready = $.ready;

readyList = $.Deferred();
readyList.promise( ready );

})( window );
