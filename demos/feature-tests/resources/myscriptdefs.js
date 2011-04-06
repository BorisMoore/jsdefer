$.deferDef({
	a: {
		url: "folder1/a.js",
		minUrl: "folder1/a.min.js",
		depends: [ "e", "f.js" ]
	},
	e: "folder2/e.js"
});
