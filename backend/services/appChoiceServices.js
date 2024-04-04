const AppChoice = require("../models/appChoiceModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");

const getAppChoicesService = async (
  keysToInclude = ["appChoices", "users", "products"],
  appChoiceFilter
) => {
  const appChoices = [];
  if (keysToInclude.includes("appChoices")) {
    appChoices.push(
      ...(await AppChoice.find(appChoiceFilter ? appChoiceFilter : {}))
    );
  }

  if (keysToInclude.includes("users")) {
    appChoices.push({
      key: "users",
      values: await User.find().select("name email role isEnabled _id"),
    });
  }
  if (keysToInclude.includes("products")) {
    appChoices.push({
      key: "products",
      values: await Product.find().select("_id description"),
    });
  }
  return appChoices;
};

const createAppChoiceService = async (appChoiceData) => {
  const multipleMode = Array.isArray(appChoiceData);
  if (!multipleMode) appChoiceData = [appChoiceData];
  const returnAppChoices = [];
  for (let appChoice of appChoiceData) {
    for (let value of appChoice.values) {
      if (value.editable !== undefined && typeof value.editable !== "boolean") {
        throw new Error("editable must be a boolean value.");
      }
      if (
        value.deletable !== undefined &&
        typeof value.deletable !== "boolean"
      ) {
        throw new Error("deletable must be a boolean value.");
      }
    }
    returnAppChoices.push(await AppChoice.create(appChoice));
  }
  return multipleMode ? returnAppChoices : returnAppChoices[0];
};

const updateAppChoiceService = async (id, appChoiceData, key = "_id") => {
  const appChoice = await AppChoice.findOne({ [key]: id });
  if (!appChoice) {
    throw new Error("The app choice was not found.");
  }

  const incomingIds = appChoiceData.values.map(
    (choiceValue) => choiceValue._id
  );
  const nonEditableChoices = [];

  // Filter out choices that are not in the incoming data and are editable
  appChoice.values = appChoice.values.filter((choiceValue) => {
    if (!incomingIds.includes(choiceValue._id.toString())) {
      if (choiceValue.editable) {
        return false; // Delete from db
      } else {
        nonEditableChoices.push(choiceValue);
      }
    }
    return true;
  });

  // Update the choices that are editable and add new choices
  for (let choiceValue of appChoiceData.values) {
    const existingValue = appChoice.values.id(choiceValue._id);
    if (existingValue) {
      if (existingValue.editable) {
        existingValue.value = choiceValue.value;
      }
    } else {
      appChoice.values.push(choiceValue); // Add new choices
    }
  }

  // Sort choices to match incoming order and move non-editable choices to the top
  appChoice.values.sort((a, b) => {
    const aIndex = incomingIds.indexOf(a._id.toString());
    const bIndex = incomingIds.indexOf(b._id.toString());

    if (aIndex === -1) return -1; // Non-editable choices go to the top
    if (bIndex === -1) return 1;

    return aIndex - bIndex;
  });

  await appChoice.save();
  return appChoice;
};

const deleteAppChoiceValueService = async (id, valueId) => {
  const appChoice = await AppChoice.findById(id);
  if (!appChoice) {
    throw new Error("The app choice was not found.");
  }

  const choiceValue = appChoice.values.id(valueId);
  if (!choiceValue) {
    throw new Error("The choice value was not found.");
  }

  if (!choiceValue.deletable) {
    throw new Error("The choice value is not deletable.");
  }

  choiceValue.remove();
  await appChoice.save();
  return { id: valueId };
};

const deleteEntireAppChoiceService = async (id) => {
  const appChoice = await AppChoice.findById(id);
  if (!appChoice) {
    throw new Error("The app choice was not found.");
  }
  await appChoice.remove();
  return { id };
};

module.exports = {
  getAppChoicesService,
  createAppChoiceService,
  updateAppChoiceService,
  deleteAppChoiceValueService,
  deleteEntireAppChoiceService,
};
