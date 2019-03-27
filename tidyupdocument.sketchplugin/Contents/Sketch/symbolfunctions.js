// assumes non-nested symbol
function setOverrideText(instance, overrideName, newText){
	let symbolMaster = instance.symbolMaster();
	let children = symbolMaster.children();
	for (let i = 0; i < children.count(); i++){
		let layer = children[i];
		if (layer.name() == overrideName){
			let objectID = layer.objectID();
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
		let layer = children[i];
		if (layer.name() == overrideName){
			return layer.stringValue();
		}
	}
	return undefined;
}

// assumes non-nested symbol
function getOverrideText(instance, overrideName){
	let symbolMaster = instance.symbolMaster();
	let children = symbolMaster.children();
	for (let i = 0; i < children.count(); i++){
		layer = children[i];
		if (layer.name() == overrideName){
			return instance.overrides()[layer.objectID()];
		}
	}
	return undefined;
}

function symbolMasterWithOverrideName(doc, overrideName) {
  var symbolMasters = doc.documentData().allSymbols();
  for (let i = 0; i < symbolMasters.count(); i++){
		symbolMaster = symbolMasters[i];
		symbolLayers = symbolMaster.children();
		for (let j = 0; j < symbolLayers.count(); j++){
			symbolLayer = symbolLayers[j];
      if (symbolLayer.name() == overrideName) {
          return symbolMaster;
      }
		}
  }
	return undefined;
}
