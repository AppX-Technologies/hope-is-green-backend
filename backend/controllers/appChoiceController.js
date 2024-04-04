const asyncHandler = require("express-async-handler");
const {
  getAppChoicesService,
  createAppChoiceService,
  updateAppChoiceService,
  deleteEntireAppChoiceService,
  deleteAppChoiceValueService,
} = require("../services/appChoiceServices");

const getAppChoices = asyncHandler(async (req, res) => {
  const keysToInclude = req.body.keys;
  const appChoiceFilter = req.body.appChoiceFilter;
  const appChoices = await getAppChoicesService(keysToInclude, appChoiceFilter);
  res.status(200).json(appChoices);
});

const createAppChoice = asyncHandler(async (req, res) => {
  const appChoices = await createAppChoiceService(req.body);
  res.status(200).json(appChoices);
});

const updateAppChoice = asyncHandler(async (req, res) => {
  const updatedAppChoice = await updateAppChoiceService(
    req.params.id,
    req.body
  );
  res.status(200).json(updatedAppChoice);
});

const deleteEntireAppChoice = asyncHandler(async (req, res) => {
  const deletedAppChoice = await deleteEntireAppChoiceService(req.params.id);
  res.status(200).json(deletedAppChoice);
});

const deleteAppChoiceValue = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(await deleteAppChoiceValueService(req.params.id, req.params.valueId));
});

module.exports = {
  getAppChoices,
  createAppChoice,
  updateAppChoice,
  deleteEntireAppChoice,
  deleteAppChoiceValue,
};
