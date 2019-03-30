@import 'common.js';
@import 'symbolfunctions.js';
@import 'artboardfunctions.js';
const {toArray} = require('util');
var Settings = require('sketch/settings');

// called from plug-in menu
var _tableOfContents = function(context) {
  let summary = [];
  doc = context.document;
  let colSpacing = undefined;
  // check if file is set up for creating a TOC
  if (checkTocSetup(doc, summary) !== undefined) {
    // check if there is a stored setting for column spacing
    colSpacing = Settings.settingForKey('col-spacing');
    if (colSpacing === undefined) {
      // there's no stored setting, use default of 40
      colSpacing = 40;
    }
    colSpacing = doc.askForUserInput_initialValue_("Spacing between columns", colSpacing);
    Settings.setSettingForKey('col-spacing', colSpacing);
    pageNumberArtboards(context, summary);
    tableOfContents(context, summary);
  }
  displaySummary(doc, summary);
}

// called from plug-in menu
var _doEverything = function(context) {
  doc = context.document;
  var colSpacing = Settings.settingForKey('col-spacing');
  if (colSpacing === undefined) {
    colSpacing = 40;
    Settings.setSettingForKey('col-spacing', colSpacing)
  }
  let summary = [];
  if (checkPageNumberSetup(doc, summary) !== undefined){
    pageNumberArtboards(context, summary);
  }
  if (checkNameArtboardSetup(doc, summary) !== undefined){
    nameArtboards(context, summary);
  }
  if (checkDateSetup(doc, summary) !== undefined){
    addCurrentDate(context, summary);
  }
  if (checkTocSetup(doc, summary) !== undefined) {
    tableOfContents(context, summary);
  }
  displaySummary(doc, summary);
}

// called from plug-in menu
var _addCurrentDate = function(context) {
  const doc = context.document;
  let summary = [];
  if (checkDateSetup(doc, summary) !== undefined){
    addCurrentDate(context, summary);
  }
  displaySummary(doc, summary);
}

// called from plug-in menu
var _nameArtboards = function(context) {
  doc = context.document;
  let summary = [];
  if (checkNameArtboardSetup(doc, summary) !== undefined){
    nameArtboards(context, summary);
  }
  displaySummary(doc, summary);
}

// called from plug-in menu
var _pageNumberArtboards = function(context) {
  const doc = context.document;
  let summary = [];
  if (checkPageNumberSetup(doc, summary) !== undefined){
    pageNumberArtboards(context, summary);
  }
  displaySummary(doc, summary);
}

// called when any layer is resized; this is defined in manifest.json
var _onLayersResizedFinish = function(context, instance) {
  const action = context.actionContext;
  const doc = action.document;
  // get all layers that are being manually resized; note that this event does not
  // chain to children of the layer being resized
  const layers = action.layers;
  for (let i = 0; i < layers.count(); i++) {
    layer = layers[i];
    // lay out the TOC if the TOC group is being resized
    if (layer.name() == '<tocGroup>') {
      layoutTOC(doc);
    }
  };
}

//======================================================

/*
This creates a table of contents for artboards on the current page. If the document
is broken into sections using section-heading pages, the TOC will be broken up
into sections as well

Required elements:
  - A symbol instance with a text override named <pageTitle> on all pages you want a TOC page entry
  - A symbol instance with a text override named <pageNumber> on any page you want the TOC to show a page number
  - A symbol master (on the Symbols page) with text overrides <tocPageTitle> and <tocPageNumber>
    This symbol will be instantiated in the TOC for each page that has an instance with the override <pageTitle>
Optional elements (if you have sections in your doc)
  - A symbol instance with a text override named <sectionTitle> on all pages you want a TOC section entry
  - A symbol master (on the Symbols page) with text override <tocSectionTitle>
    (This symbol can also include a <tocPageNumber> override if you want to page-number sections)
    This symbol will be instantiated in the TOC for each page that has an instance with the override <sectionTitle>

More details at https://github.com/josephxbrick/tidyupdocument
*/

function tableOfContents(context, summary) {
  const doc = context.document;
  const page = doc.currentPage();
  // get all artboards on the current page
  let artboards = toArray(page.layers()).filter(item => item.class() === MSArtboardGroup);
  // sort artboards based on how they are laid out, left-to-right or top-to-bottom
  sortArtboardsByLayout(artboards);
  // this array will contain each TOC entry, which will be either a section title or page title)
  let tocArray = [];
  for (const artboard of artboards) {
    let curPageNumber = undefined;
    let curPageTitle = undefined;
    let curSectionTitle = undefined;
    // get all symbol instances on the current artboard and find the ones that we care about
    let instances = toArray(artboard.children()).filter(item => item.class() === MSSymbolInstance);
    for (const instance of instances) {
      // Here we will walk through every symbol instance on the artboard looking for TOC values.
      // The second parameter of getOverrideText() is the name of the text override whose
      // value we want. If the instance's symbol does not offer that override, getOverrideText()
      // returns undefined.
      if (curPageNumber === undefined) {
        curPageNumber = getOverrideText(instance, '<pageNumber>');
      }
      if (curPageTitle === undefined) {
        curPageTitle = getOverrideText(instance, '<pageTitle>');
      }
      if (curSectionTitle === undefined) {
        curSectionTitle = getOverrideText(instance, '<sectionTitle>');
      }
    }
    // if we have a page title or a section title, we've got a TOC entry, so log it
    if (curSectionTitle !== undefined || curPageTitle !== undefined) {
      tocArray.push({
        sectionTitle: (curSectionTitle === undefined) ? '<undefined>' : curSectionTitle,
        pageTitle: (curPageTitle === undefined) ? '<undefined>' : curPageTitle,
        pageNumber: (curPageNumber === undefined) ? '<undefined>' : curPageNumber
      });
    }
  }

  // we've logged everything into the array, so onward!
  initializeTOC(doc)
  createTOC(doc, tocArray);
  layoutTOC(doc);
  summary.push(`${tocArray.length} items added to TOC`);
}

// remove all previous TOC groups from the TOC
function initializeTOC(doc) {
  const page = doc.currentPage();
  const tocGroup = layerWithName(page, MSLayerGroup, '<tocGroup>');
  if (tocGroup !== undefined) {
    // remove all TOC groups.
    const groups = toArray(tocGroup.layers()).filter(item => item.class() === MSLayerGroup);
    for (const group of groups) {
      tocGroup.removeLayer(group);
    }
    return true;
  } else {
    return undefined;
  }
}

// load the TOC with sectionTitle and pageTitle instances
function createTOC(doc, tocArray) {
  const page = doc.currentPage();
  const tocSectionMaster = symbolMasterWithOverrideName(doc, '<tocSectionTitle>');
  const tocPageMaster = symbolMasterWithOverrideName(doc, '<tocPageTitle>');
  const tocGroup = layerWithName(page, MSLayerGroup, '<tocGroup>');
  // The TOC will be broken up into groups. The plugin groups sections together (e.g.,
  // the section header is grouped with all of its pages). If there is a page with no
  // parent section, it gets its own group. The loop below creates the groups.
  let curGroup = [];
  let curGroupName = undefined;
  let runningTop = 0;
  let groupNumber = 0;
  let isPartOfSection = false;
  let instance = undefined
  let initColWidth = 100; // this is to make sure that sections are same width as pages
  for (let i = 0; i < tocArray.length; i++) {
    let tocItem = tocArray[i];
    if (curGroup.length == 0){
      curGroupName = `TOC group: ${(tocItem.sectionTitle != '<undefined>') ? tocItem.sectionTitle : tocItem.pageTitle}`;
    }
    if (tocItem.sectionTitle != '<undefined>') {
      // this item is a TOC section header
      instance = tocSectionMaster.newSymbolInstance();
      instance.setConstrainProportions(0); // unlock the aspect ratio
      instance.frame().setWidth(initColWidth);
      // store text values into object properties, because we can't set the overrides
      // yet as the instances are not part of the document
      instance.sectionTitle = tocItem.sectionTitle;
      instance.setName(`TOC item: ${tocItem.sectionTitle}`);
      instance.pageNumber = tocItem.pageNumber;
      // we've just started a new section, so set isPartOfSection to true
      isPartOfSection = true;
    } else if (tocItem.pageTitle != '<undefined>') {
      // this item is a TOC page
      instance = tocPageMaster.newSymbolInstance();
      instance.setConstrainProportions(0); // unlock the aspect ratio
      instance.frame().setWidth(initColWidth);
      // store text values into object properties
      instance.pageTitle = tocItem.pageTitle;
      instance.setName(`TOC item: ${tocItem.pageTitle}`);
      instance.pageNumber = tocItem.pageNumber;
    }
    instance.frame().setX(0);
    instance.frame().setY(runningTop);
    runningTop += instance.frame().height();
    // add the instance to the array we're building; we will eventually add this
    // array to a group
    curGroup.push(instance);
    if (i == tocArray.length - 1 || isPartOfSection == false || tocArray[i + 1].sectionTitle != '<undefined>') {
      // the current item is either the very last TOC item, or it's a sectionless TOC page,
      // or the next item starts a new section, so let's add the items we've been collecting
      // to a new group
      let tocEntry = MSLayerGroup.new();
      tocEntry.setConstrainProportions(0); // unlock aspect ratio
      groupNumber++;
      tocEntry.setName(curGroupName);
      tocEntry.addLayers(curGroup);
      tocEntry.fixGeometryWithOptions(0); // fit group to its contents
      tocGroup.addLayers([tocEntry]); // add the group to the TOC
      // get ready to start a new group
      curGroup = [];
      isPartOfSection = false;
    }
  }
  // now that all instances reside in the document, we can update their overrides
  instances = toArray(tocGroup.children()).filter(item => item.class() === MSSymbolInstance);
  for (instance of instances) {
    setOverrideText(instance, '<tocPageTitle>', instance.pageTitle);
    setOverrideText(instance, '<tocSectionTitle>', instance.sectionTitle);
    setOverrideText(instance, '<tocPageNumber>', instance.pageNumber);
  }
}

function layoutTOC(doc) {
  // get stored colSpacing setting
  let colSpacing = Settings.settingForKey('col-spacing');
  if (colSpacing === undefined){
    colSpacing = 40;
  } else {
    colSpacing = Number(colSpacing);
  }
  const page = doc.currentPage();
  const tocGroup = layerWithName(page, MSLayerGroup, '<tocGroup>');
  const tocRect = layerWithName(tocGroup, MSRectangleShape, '<tocGroupRect>')
  const tocW = tocGroup.frame().width();
  const tocH = tocGroup.frame().height();
  // get all groups in toc
  let groups = toArray(tocGroup.layers()).filter(item => item.class() === MSLayerGroup);
  let curY = curCol = 0;
  // add groups to an array of columns while setting each group's vertical position
  let columns = [[]];
  for (const group of groups) {
    if (curY > 0 && curY + group.frame().height() > tocH) {
      // group extends beyond the height of the TOC, so create new column for it
      curCol++
      columns.push([]);
      curY = 0;
    }
    group.frame().setY(curY);
    curY += group.frame().height();
    columns[curCol].push(group);
  }
  // set each group's x position and width; also set each group's pinning
  const numColumns = columns.length;
  const colWidth = Math.round((tocW - colSpacing * (numColumns - 1)) / numColumns);
  for (let i = 0; i < numColumns; i++) {
    let column = columns[i];
    let x = i * (colWidth + colSpacing);
    for (j = 0; j < column.length; j++) {
      let group = column[j];
      // set all pinning to false
      group.setFixed_forEdge_(false, 32) //pin top
      group.setFixed_forEdge_(false, 1) // pin right
      group.setFixed_forEdge_(false, 4) // pin left
      // fix height of group
      group.setFixed_forEdge_(true, 16); // fixed height
      // set x and width
      group.frame().setX(x);
      group.frame().setWidth(colWidth);
      if (j == 0) {
        // group is top group of column
        group.setFixed_forEdge_(true, 32); // pin top
      }
      if (i == 0) {
        // group is leftmost group
        group.setFixed_forEdge_(true, 4); // pin left
      } else if (i == numColumns - 1) {
        // group is rightmost group
        group.setFixed_forEdge_(true, 1); // pin right
      }
    }
  }
  // set the tocGroup's rectangle to size of group, just in case
  tocRect.frame().setWidth(tocGroup.frame().width());
  tocRect.frame().setHeight(tocGroup.frame().height());
}

// make sure user is set up for TOC
function checkTocSetup(doc, summary) {
  let retval = 'success';
  const pageNumber = symbolMasterWithOverrideName(doc, '<pageNumber>');
  if (pageNumber === undefined) {
    summary.push('[ERROR]Table of contents: No symbol with override <pageNumber> found.');
    retval = undefined;
  }
  const pageTitle = symbolMasterWithOverrideName(doc, '<pageTitle>');
  if (pageTitle === undefined) {
    summary.push('[ERROR]Table of contents: No symbol with override <pageTitle> found.');
    retval = undefined;
  }
  const tocPageTitle = symbolMasterWithOverrideName(doc, '<tocPageTitle>');
  if (tocPageTitle === undefined) {
    summary.push('[ERROR]Table of contents: No symbol with override <tocPageTitle> found.');
    retval = undefined;
  }
  const tocGroup = layerWithName(doc.currentPage(), MSLayerGroup, '<tocGroup>');
  if (tocGroup === undefined) {
    summary.push('[ERROR]Table of contents: No group named <tocGroup> found on this Sketch page.');
    retval = undefined;
  }
  if (tocGroup !== undefined && layerWithName(tocGroup, MSRectangleShape, '<tocGroupRect>') === undefined) {
    summary.push('[ERROR]Table of contents: <tocGroup> must contain a rectangle named <tocGroupRect>.');
    retval = undefined;
  }
  return retval;
}
//============================================================

function addCurrentDate(context, summary) {
  const doc = context.document;
  const page = doc.currentPage();
  let artboards = toArray(page.layers()).filter(item => item.class() === MSArtboardGroup);
  let datesAdded = 0;
  for (const artboard of artboards) {
    instances = toArray(artboard.children()).filter(item => item.class() === MSSymbolInstance);
    for (const instance of instances) {
      if (setCurrentDate(instance, '<currentDate>') !== undefined) {
        datesAdded++;
      }
    }
  }
  // summary
  const br = String.fromCharCode(13);
  summary.push(`${datesAdded} dates updated`);
}

function setCurrentDate(instance, overrideName) {
  let template = originalTemplate = getDefaultOverrideText(instance, overrideName);
  if (template !== undefined) {
    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth(); //January is 0
    const y = today.getFullYear();
    const longMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m];
    // using month abbreviations from writing style guide, rather than just first 3 letters.
    const shortMonth = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][m];

    // comments below assume date of 1/3/2019
    template = template.replace('[MMMM]', longMonth); // January
    template = template.replace('[MMM]', shortMonth); // Jan
    template = template.replace('[MM]', '0'.concat(m + 1).slice(-2)); // 01
    template = template.replace('[M]', m + 1); // 1
    template = template.replace(['[DDD]'], addOrdinalIndicator(d)); // 3rd
    template = template.replace(['[DD]'], '0'.concat(d).slice(-2)); // 03
    template = template.replace('[D]', d); // 3
    template = template.replace('[YYYY]', y); // 2019
    template = template.replace('[YY]', y.toString().slice(-2)); // 19

    if (template == originalTemplate) {
      // no template specified, so return date in MM/DD/YYYY format
      template = `${'0'.concat(m + 1).slice(-2)}/${'0'.concat(d).slice(-2)}/${y}`;
    }
    return setOverrideText(instance, overrideName, template);
  }
  return undefined;
}

function addOrdinalIndicator(num) {
  lastNum = num.toString().slice(-1);
  if (lastNum == '1') {
    return `${num}st`;
  } else if (lastNum == '2') {
    return `${num}nd`;
  } else if (lastNum == '3') {
    return `${num}rd`;
  } else {
    return `${num}th`;
  }
}

// make sure user is set up for current date
function checkDateSetup(doc, summary) {
  const curDate = symbolMasterWithOverrideName(doc, '<currentDate>');
  if (curDate === undefined) {
    summary.push('[ERROR]Update dates: No symbol with override <currentDate> found.');
    return undefined;
  }
  return 'success';
}
//==================================================================

function nameArtboards(context, summary) {
  const doc = context.document;
  const page = doc.currentPage();
  let artboards = toArray(page.layers()).filter(item => item.class() === MSArtboardGroup);
  let titlesAdded = 0;
  for (const artboard of artboards) {
    instances = toArray(artboard.children()).filter(item => item.class() === MSSymbolInstance);
    for (const instance of instances) {
      if (setArtboardName(artboard, instance, '<sectionTitle>') !== undefined) {
        titlesAdded++;
      }
      if (setArtboardName(artboard, instance, '<pageTitle>') !== undefined) {
        titlesAdded++;
      }
    }
  }
  // summary
  const br = String.fromCharCode(13);
  summary.push(`${titlesAdded} artboards named`);
}

function setArtboardName(artboard, instance, overrideName) {
  let overrideText = getOverrideText(instance, overrideName);
  if (overrideText !== undefined) {
    artboard.setName(overrideText);
    return overrideText;
  }
  return undefined;
}

function checkNameArtboardSetup(doc, summary) {
  const pageTitle = symbolMasterWithOverrideName(doc, '<pageTitle>');
  if (pageTitle === undefined) {
    summary.push('[ERROR]Name artboards: No symbol with override <pageTitle> found.');
    return undefined;
  }
  return 'success';
}
// =============================================================

function pageNumberArtboards(context, summary) {
  const doc = context.document
  const page = doc.currentPage();
  const startPageNum = 1;
  let artboards = toArray(page.layers()).filter(item => item.class() === MSArtboardGroup);
  sortArtboardsByLayout(artboards);
  let curPage = startPageNum;
  let totalPages = 0
  let numbersAdded = 0;
  let firstPageWithNumber = 0;
  let firstPageFound = false;

  for (let i = 0; i < artboards.length; i++) {
    let artboard = artboards[i];
    instances = toArray(artboard.children()).filter(item => item.class() === MSSymbolInstance);
    for (const instance of instances) {
      if (setPageNumber(instance, '<pageNumber>', curPage) !== undefined) {
        firstPageFound = true;
        numbersAdded++;
      }
    }
    if (firstPageFound) {
      if (firstPageWithNumber == 0) {
        firstPageWithNumber = i + 1;
      }
      totalPages = curPage;
      curPage++;
    }
  }
  // summary
  const br = String.fromCharCode(13);
  summary.push(`${numbersAdded} page numbers updated`);
}

function setPageNumber(instance, overrideName, pageNumber) {
  let template = getDefaultOverrideText(instance, overrideName);
  if (template !== undefined) {
    if (template.indexOf('#') >= 0) {
      // look for '#' in default override (e.g., 'Page #') and replace # with pageNumber
      template = template.replace('#', pageNumber);
      return setOverrideText(instance, overrideName, template);
    } else {
      // '#' not found, so simply set the override text to page number
      return setOverrideText(instance, overrideName, pageNumber.toString());
    }
  }
  return undefined;
}

// make sure user is set up for page numbers
function checkPageNumberSetup(doc, summary) {
  const pageNumber = symbolMasterWithOverrideName(doc, '<pageNumber>');
  if (pageNumber === undefined) {
    summary.push('[ERROR]Page-number artboards: No symbol with override <pageNumber> found.');
    return undefined;
  }
  return 'success';
}
