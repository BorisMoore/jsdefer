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
	tmplPlus: {
		bare: true,
		url: "jQueryPlugins/templates/jquery.tmplPlus.js",
		depends: "tmpl"
	},
	moviePlugin: {
		url: "moviePlugin.js",
		depends: "tmplPlus"
	},
	movieApp: {
		url: "movieApp.js",
		depends: "tmplPlus"
	}
});
