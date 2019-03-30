var UI = require('sketch/ui')

function getTextFromUser(prompt, initialValue) {
  let retval = undefined;
  UI.getInputFromUser(
    prompt, {
      initialValue: initialValue,
    },
    (err, value) => {
      if (!err) {
        // user did not cancel
        retval = value;
      }
    }
  );
  return retval;
}

function getSelectionFromUser(prompt, possibleValues, defaultValue) {
  if (defaultValue === undefined) {
    defalutValue = possibleValues[0];
  }
  let retval = undefined;
  UI.getInputFromUser(
    prompt, {
      type: UI.INPUT_TYPE.selection,
      possibleValues: possibleValues,
      initialValue: defalutValue,
    },
    (err, value) => {
      if (!err) {
        // user did not cancel
        retval = value;
      }
    }
  );
  return retval;
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
