#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1);
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var cheerioHtmlUrl = function(result) {
    return cheerio.load(result);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function($, checksfile) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var downloadHtml = function(inurl) {
    var url = inurl.toString();
    rest.get(url).on('complete', function(result) {
	if (result instanceof Error) {
	    console.log("Error proccesing URL: " + result.message);
	    process.exit(1);
	} else {
	    var checkJson = checkHtmlFile(cheerioHtmlUrl(result), program.checks);
	    var outJson = JSON.stringify(checkJson, null, 4);
	    console.log(outJson);
	}
	});
};
if(require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', HTMLFILE_DEFAULT)
	.option('-u, --url <url>', 'Web path to an html file', null)
	.parse(process.argv);

    if (program.url != null && program.file != HTMLFILE_DEFAULT) {
	console.log("Both a URL and filename were given, please only specify one.");
	process.exit(1);
    } else if (program.url != null) {
	downloadHtml(program.url);
    } else {
	var checkJson = checkHtmlFile(cheerioHtmlFile(program.file), program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
