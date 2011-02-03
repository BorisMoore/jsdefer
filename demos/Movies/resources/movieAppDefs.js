$.deferDef({
	tmpl: "jQueryPlugins/templates/jquery.tmpl.js", // Could point to CDN, but this is not currently wrapped.
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
