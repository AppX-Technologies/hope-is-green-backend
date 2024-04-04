const _ = require("lodash");
const sanitizerConfig = require("../config/sanitizerConfig");

const sanitize = (object, model, role) => {
  let modelConfig = sanitizerConfig[model][role];

  // If no specific role config is found, fallback to "All"
  if (!modelConfig) {
    modelConfig = sanitizerConfig[model]["All"];
  }

  // If no config found for the role or "All", throw an error
  if (!modelConfig) {
    throw new Error(
      `No sanitizer configuration found for model ${model} and role ${role}`
    );
  }

  let clonedObject = _.cloneDeep(object);

  if (modelConfig.mode === "blacklist") {
    modelConfig.paths.forEach((path) => _.unset(clonedObject, path));
  } else if (modelConfig.mode === "whitelist") {
    let tempObj = {};
    modelConfig.paths.forEach((path) =>
      _.set(tempObj, path, _.get(clonedObject, path))
    );
    clonedObject = tempObj;
  }

  return clonedObject;
};

module.exports = {
  sanitize,
};
