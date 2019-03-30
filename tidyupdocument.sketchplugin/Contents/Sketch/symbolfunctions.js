// assumes non-nested symbol
function setOverrideText(instance, overrideName, newText){
	let symbolMaster = instance.symbolMaster();
	let children = symbolMaster.children();
	for (let i = 0; i < children.count(); i++){
		let child = children[i];
		if (child.class() === MSTextLayer && child.name() == overrideName){
			let objectID = child.objectID();
			if (instance.overrides()[objectID] !== undefined) {
				const dictionary = instance.overrides() || NSDictionary.dictionary();
				const overrides = NSMutableDictionary.dictionaryWithDictionary(dictionary);
				overrides[objectID] = newText;
				instance.overrides = overrides;
				return newText;
			}
		}
	}
	return undefined;
}

// assumes non-nested symbol
function getDefaultOverrideText(instance, overrideName){
	let symbolMaster = instance.symbolMaster();
	let children = symbolMaster.children();
	for (let i = 0; i < children.count(); i++){
		let child = children[i];
		if (child.class() === MSTextLayer && child.name() == overrideName){
			return child.stringValue();
		}
	}
	return undefined;
}

// assumes non-nested symbol
function getOverrideText(instance, overrideName){
	let symbolMaster = instance.symbolMaster();
	let children = symbolMaster.children();
	for (let i = 0; i < children.count(); i++){
		child = children[i];
		if (child.class() === MSTextLayer && child.name() == overrideName){
			return instance.overrides()[child.objectID()];
		}
	}
	return undefined;
}

function symbolMasterWithOverrideName(doc, overrideName) {
  var symbolMasters = doc.documentData().allSymbols();
  for (let i = 0; i < symbolMasters.count(); i++){
		symbolMaster = symbolMasters[i];
		children = symbolMaster.children();
		for (let j = 0; j < children.count(); j++){
			child = children[j];
      if (child.class() === MSTextLayer && child.name() == overrideName) {
          return symbolMaster;
      }
		}
  }
	return undefined;
}
