
/** */
const enum ConstS
{
	baseFolderPrefix = "patch-base-folder-",
	mainDatabaseName = "main",
	textContrastProperty = "--text-contrast",
	htmlFileName = "index.html",
	cssFileNameGeneral = "index.general.css",
	cssFileNameSpecific = "index.css",
	jsFileName = "turf.js",
	jsFileNameMin = "turf.min.js",
	textContrastBlackName = "res.blur-black.png",
	textContrastWhiteName = "res.blur-white.png",
	debugExportsFolderName = "+exports",
}

/** */
const enum ConstN
{
	foregroundEdgeVmin = 4,
	fillerContentBlur = 40,
}

/** */
const enum CssClass
{
	// Editor classes
	dragOverScreen = "drag-over-screen",
	hide = "hide",
	appRoot = "app-root",
	patchesView = "patches-view",
	patchViewTransition = "patch-view-transition",
	
	// Player classes
	story = "story",
	scene = "scene",
	captionScene = "scene-caption",
	captionSceneBackgroundImage = "bg",
	captionSceneForeground = "fg",
	captionSceneContentImage = "fg-content-image",
	proseScene = "scene-prose",
	proseSceneForeground = "scene-prose-fg",
	galleryScene = "scene-gallery",
	galleryFrame = "frame",
	galleryFrameLegend = "frame-legend",
	videoScene = "scene-video",
	snapFooter = "snap-footer",
	textContrast = "text-contrast",
	textContrastDark = "text-contrast-dark",
	textContrastLight = "text-contrast-light",
}

/** */
enum Origin
{
	topLeft = "origin-tl",
	top = "origin-t",
	topRight = "origin-tr",
	left = "origin-l",
	center = "origin-c",
	right = "origin-r",
	bottomLeft = "origin-bl",
	bottom = "origin-b",
	bottomRight = "origin-br",
}

/** */
const enum CaptionedButtonClass
{
	all = "cb",
	pillOutline = "cb-po",
	pillFilled = "cb-pf",
	roundedOutline = "cb-ro",
	roundedFilled = "cb-rf",
	squareOutline = "cb-so",
	squareFilled = "cb-sf",
}

/** */
const enum DataAttributes
{
	transition = "t",
	textEffect = "e",
}

/** */
type SizeMethod = "cover" | "contain";

/** */
type Literal<K extends keyof any, T> = { [P in K]: T; };
