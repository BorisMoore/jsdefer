$.deferDef({
	jQuery: {
		bare: true,
		url: "http://code.jquery.com/jquery.js",
		loaded: "window.jQuery"
	},
	tmpl: {
		url: "jQueryPlugins/templates/jquery.tmpl.js",
		depends: "jQuery"
	},
	tmplplus: {
		bare: true,
		url: "jQueryPlugins/templates/jquery.tmplplus.js",
		depends: "tmpl"
	},
	moviePlugin: {
		url: "moviePlugin.js",
		depends: "tmplplus"
	},
	movieApp: {
		url: "movieApp.js",
		depends: "tmplplus"
	}
});
