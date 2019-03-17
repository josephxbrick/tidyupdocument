@import 'common.js';
@import 'symbolfunctions.js';
@import 'artboardfunctions.js';

var doEverything = function(context) {
  const doc = context.document;
  const page = doc.currentPage();
  const startPageNum = 1;
  const pageNumberOverrideName = '<pageNumber>';
  const dateOverrideName = '<currentDate>';
	const titleOverrideName = '<pageTitle>';
  let artboards = [page artboards];
  let artboardCount = artboards.count();
  sortArtboardsByLayout(artboards);

  let curPage = startPageNum;
  let totalPages = 0
  let firstPageWithNumber = 0;
  let firstPageFound = false;
  let numbersAdded = 0;
  let titlesAdded = 0;
  let datesAdded = 0;

  for (let i = 0; i < artboardCount; i++) {
    let artboard = artboards[i];
		setTimeout(() => {
      doc.showMessage(`Updating artboard ${i + 1}. ${((i + 1)/artboardCount * 100).toFixed(0)}% complete.`)
    }, 0);
    layers = artboard.children();
    for (let j = 0; j < layers.count(); j++) {
      let layer = layers[j];
      if (layer.class() === MSSymbolInstance) {
        if (setPageNumber(layer, pageNumberOverrideName, curPage) !== undefined) {
          firstPageFound = true;
          numbersAdded++;
        }
        if (setCurrentDate(layer, dateOverrideName) !== undefined) {
          datesAdded++;
        }
        if (setArtboardName(artboard, layer, titleOverrideName) !== undefined) {
          titlesAdded++;
        }
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
  const br = String.fromCharCode(13);
	setTimeout(() => {
		alert('Update complete', `${br}Page numbers updated: ${numbersAdded}${br}First artboard with a page number instance: ${firstPageWithNumber}${br}Total artboards (starting at artboard ${firstPageWithNumber}): ${totalPages}${br}${br}Dates updated: ${datesAdded}${br}${br}Artboard names updated: ${titlesAdded}`)
	}, 100);
}

//============================================================

var addCurrentDate = function(context) {
  const doc = context.document;
  const page = doc.currentPage();
  const currentDateOverrideName = '<currentDate>';
  let artboards = [page artboards];
  let artboardCount = artboards.count();
  let datesAdded = 0;
  for (let i = 0; i < artboardCount; i++) {
    let artboard = artboards[i];
    setTimeout(() => {
      doc.showMessage(`Updating artboard ${i + 1}. ${((i + 1)/artboardCount * 100).toFixed(0)}% complete.`);
    }, 0);

    layers = artboard.children();
    for (let j = 0; j < layers.count(); j++) {
      let layer = layers[j];
      if (layer.class() === MSSymbolInstance) {
        if (setCurrentDate(layer, currentDateOverrideName) !== undefined) {
          datesAdded++;
        }
      }
    }
  }
  // summary
  const br = String.fromCharCode(13);
  setTimeout(() => {
    alert('Update complete', `${br}Date instances updated: ${datesAdded}${br}`)
  }, 50);

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

//===============================================

var nameArtboards = function(context) {
  const doc = context.document;
  const page = doc.currentPage();
  const pageNumberOverrideName = '<pageNumber>';
  const currentDateOverrideName = '<currentDate>'
  const artboardTitleOverrideName = '<pageTitle>'
  let artboards = [page artboards];
  let artboardCount = artboards.count();
  let titlesAdded = 0;
  for (let i = 0; i < artboardCount; i++) {
    let artboard = artboards[i];
    setTimeout(() => {
      doc.showMessage(`Updating artboard ${i + 1}. ${((i + 1)/artboardCount * 100).toFixed(0)}% complete.`)
    }, 0);
    layers = artboard.children();
    for (let j = 0; j < layers.count(); j++) {
      let layer = layers[j];
      if (layer.class() === MSSymbolInstance) {
        if (setArtboardName(artboard, layer, artboardTitleOverrideName) !== undefined) {
          titlesAdded++;
        }
      }
    }
  }
  // summary
  const br = String.fromCharCode(13);
  const q = String.fromCharCode(34);
  setTimeout(() => {
    alert('Update complete', `${br}Titles updated: ${titlesAdded}`)
  }, 50);

}

function setArtboardName(artboard, instance, overrideName) {
  let overrideText = getOverrideText(instance, overrideName);
  if (overrideText !== undefined) {
    artboard.setName(overrideText);
    return overrideText;
  }
  return undefined;
}

// ==================================

var pageNumberArtboards = function(context) {
	const doc = context.document
	const page = doc.currentPage();
	const startPageNum = 1;
	const pageNumberOverrideName = '<pageNumber>';
	let artboards = [page artboards];
	sortArtboardsByLayout(artboards);

	let curPage = startPageNum;
	let totalPages = 0
	let numbersAdded = 0;
	let firstPageWithNumber = 0;
	let firstPageFound = false;

	for (let i = 0; i < artboards.count(); i++){
		let artboard = artboards[i];
		layers = artboard.children();
		for (let j = 0; j < layers.count(); j++){
			let layer = layers[j];
			if (layer.class() === MSSymbolInstance){
				if (setPageNumber(layer, pageNumberOverrideName, curPage) !== undefined){
					firstPageFound = true;
					numbersAdded++;
				}
			}
		}
		if (firstPageFound){
			if (firstPageWithNumber == 0){
				firstPageWithNumber = i + 1;
			}
			totalPages = curPage;
			curPage++;
		}
	}
	// summary
	const br = String.fromCharCode(13);
	const q = String.fromCharCode(34);
	alert('Update complete', `${br}Page numbers updated: ${numbersAdded}${br}First artboard with a page number instance: ${firstPageWithNumber}${br}Total artboards (starting at artboard ${firstPageWithNumber}): ${totalPages}`);
}

// assumes non-nested symbol
function setPageNumber(instance, overrideName, pageNumber){
  let template = getDefaultOverrideText(instance, overrideName);
	if (template !== undefined){
	  if (template.indexOf('#') >= 0){
			// look for '#' in default override (e.g., 'Page #') and replace # with pageNumber
	    template = template.replace('#',pageNumber);
			return setOverrideText(instance, overrideName, template);
	  } else {
			// '#' not found, so simply set the override text to page number
			return setOverrideText(instance, overrideName, pageNumber.toString());
		}
	}
	return undefined;
}
