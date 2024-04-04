const _ = require("lodash");
const sanitizerConfig = require("../config/sanitizerConfig");

const sanitize = (object, model, roles) => {
  let modelConfig;

  // Attempt to find a config for any of the provided roles
  for (let role of roles) {
    if (sanitizerConfig[model][role]) {
      modelConfig = sanitizerConfig[model][role];
      break; // Exit loop once a matching role config is found
    }
  }

  // If no specific role config is found, fallback to "All"
  if (!modelConfig) {
    modelConfig = sanitizerConfig[model]["All"];
  }

  // If no config found for the roles or "All", throw an error
  if (!modelConfig) {
    throw new Error(
      `No sanitizer configuration found for model ${model} with the provided roles`
    );
  }

  let clonedObject = _.cloneDeep(object);

  // Apply blacklist or whitelist mode as per the found configuration
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
