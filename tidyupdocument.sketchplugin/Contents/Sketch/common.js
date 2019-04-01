var UI = require('sketch/ui')
var Settings = require('sketch/settings');

// get string from user. defaultValue is ignored if value is stored in key
function getStringFromUser(prompt, defaultValue, key) {
  let storedValue = Settings.settingForKey(key);
  if (storedValue === undefined) {
    storedValue = defaultValue;
  }
  let retval = undefined;
  UI.getInputFromUser(
    prompt, {
      type: UI.INPUT_TYPE.string,
      initialValue: storedValue,
    },
    (err, value) => {
      if (!err) {
        // user did not cancel
        retval = value;
      }
    }
  );
  if (retval !== undefined) {
    Settings.setSettingForKey(key, retval);
  }
  return retval;
}

function getSelectionFromUser(prompt, possibleValues, defaultValue, key) {
  let storedValue = Settings.settingForKey(key);
  if (storedValue === undefined) {
    storedValue = defaultValue;
  }
  let retval = undefined;
  UI.getInputFromUser(
    prompt, {
      type: UI.INPUT_TYPE.selection,
      possibleValues: possibleValues,
      initialValue: storedValue,
    },
    (err, value) => {
      if (!err) {
        // user did not cancel
        retval = value;
      }
    }
  );
  if (retval !== undefined) {
    Settings.setSettingForKey(key, retval);
  }
  return retval;
}

function getStoredValue(key, defaultValue) {
  let storedValue = Settings.settingForKey(key);
  if (storedValue === undefined) {
    return defaultValue;
  }
  return storedValue;
}

function displaySummary(doc, summary) {
  const br = String.fromCharCode(13);
  const slash = String.fromCharCode(47);
  const app = [NSApplication sharedApplication];
  let errorMessage = '';
  let successMessage = '';
  for (let val of summary) {
    if (val.indexOf('[ERROR]') >= 0) {
      val = val.replace('[ERROR]', '');
      errorMessage = errorMessage.concat(`${val}${br}${br}`);
    } else {
      successMessage = successMessage.concat(`${val}, `);
    }
  }
  if (successMessage != '') {
    // get rid of trailing comma and space
    successMessage = successMessage.substr(0, successMessage.length - 2);
    doc.showMessage(successMessage);
  }
  if (errorMessage != '') {
    errorMessage = errorMessage.concat(`Plugin and documentation:${br}https:${slash}${slash}github.com${slash}josephxbrick${slash}tidyupdocument${br}`);
    [app displayDialog: errorMessage withTitle: 'Update error'];
  }

}

function layerWithName(container, className, name) {
  layers = container.children();
  for (let i = 0; i < layers.count(); i++) {
    layer = layers[i];
    if (layer.class() === className && layer.name() == name) {
      return layer;
    }
  }
  return undefined;
}