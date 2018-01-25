/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
	DocumentApp.getUi().createAddonMenu()
		.addItem('Style selection', 'styleSelection')
		.addItem('Advanced options', 'showSidebar')
		.addToUi();
}

/**
 * Runs when the add-on is installed.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
	onOpen(e);
}

/**
 * Returns an array of text selection parts.
 */
function getSelectionParts() {
	const selection = DocumentApp.getActiveDocument().getSelection();
	return selection ? selection.getRangeElements()
	// Only modify elements that can be edited as text; skip images and other non-text elements.
		.filter(function(e) { return e.getElement().editAsText; })
		.map(function(e) {
			return { text: e.getElement().editAsText(), start: e.getStartOffset(), end: e.getEndOffsetInclusive() + 1 };
		}) : [];
};

/**
 * Taste the rainbow!
 */
function setStyleForSelection(options, getColor) {
	const ui = DocumentApp.getUi();
	const parts = getSelectionParts();
	if (parts.length === 0) {
		ui.alert('Please select some text', 'You must select some text to style.', ui.ButtonSet.OK);
	}
	var color = getColor();
	try {
		for (var i = 0; i < parts.length; ++i) {
			var part = parts[i];
			for (var j = part.start; j < part.end; ++j) {
				if (!options.byWord || part.text.getText().charCodeAt(j) == 32) color = getColor();
				var style = {};
				style[DocumentApp.Attribute.FOREGROUND_COLOR] = color;
				part.text.setAttributes(j, j, style);
			}
		}
	} catch(e) {
		ui.alert("Error", "Something went wrong... Sorry!" + e, ui.ButtonSet.OK);
	}
}

function createBasicColorGenerator() {
	var basicColors = [
		// '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
		// '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
		'#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
		'#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
		'#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
		'#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
		// '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130'
	];
	return function() {
		return basicColors[Math.random() * basicColors.length >> 0];
	};
}

function createRandomColorGenerator(options) {
	return function() {
		return randomColor(options);
	};
}

function createCustomColorGenerator(options) {
	var colors = options.customColors.split(";");
	return function() {
		return colors[Math.random() * colors.length >> 0];
	};
}

var getColorGenerator = function(options) {
	switch (options.method) {
		case "randomColors":
			if (options.hue === "default") options.hue = "";
			if (options.luminosity === "default") options.luminosity = "bright";
			return createRandomColorGenerator(options);
		case "customColors":
			if (options.customColors)
				return createCustomColorGenerator(options);
			// Otherwise fall through
		case "basicColors":
			return createBasicColorGenerator();
		default:
			throw "Invalid color generator: " + options.method + ".";
	}
}

function styleSelection() {
	const ui = DocumentApp.getUi();
	const options = readOptions();
	const colorGenerator = getColorGenerator(options);

	try {
		setStyleForSelection(options, colorGenerator);
	} catch (e) {
		ui.alert('Error', 'The operator produced an error: ' + e.message, ui.ButtonSet.OK);
	}
}

function setOptions(options) {
	const userProperties = PropertiesService.getUserProperties();
	userProperties.setProperties(options);
}

function readOptions() {
	const userProperties = PropertiesService.getUserProperties();
	return {
		method: userProperties.getProperty("method") || "basicColors",
		hue: userProperties.getProperty("hue") || "default",
		luminosity: userProperties.getProperty("luminosity") || "default",
		customColors: userProperties.getProperty("customColors") || "",
		byWord: userProperties.getProperty("byWord") == "true",
	};
}

/**
 * Returns the HTML file from the specified file name.
 *
 * Used from sidebar.html to include other files.
 */
function include(filename) {
	return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function showSidebar() {
	const options = readOptions();
	const template = HtmlService.createTemplateFromFile('sidebar');
	template.options = options;
	const html = template.evaluate()
		.setTitle('Rainbow Maker')
		.setWidth(300);
	DocumentApp.getUi().showSidebar(html);
}
