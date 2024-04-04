const asyncHandler = require("express-async-handler");
const { searchFilterService } = require("../services/searchServices");

const {
  createFilterService,
  updateFilterService,
  updateMultipleFiltersService,
  deleteFilterService,
} = require("../services/filterServices");

const searchFilters = asyncHandler(async (req, res) =>
  res
    .status(200)
    .json(await searchFilterService({ ...req.body, user: req?.user }))
);

const createFilter = asyncHandler(async (req, res) => {
  res.status(200).json(await createFilterService(req.body, req.user));
});

const updateFilter = asyncHandler(async (req, res) =>
  res
    .status(200)
    .json(await updateFilterService(req.params.id, req.body, req.user))
);

const updateMultipleFilters = asyncHandler(async (req, res) =>
  res.status(200).json(await updateMultipleFiltersService(req.body, req.user))
);

const deleteFilter = asyncHandler(async (req, res) =>
  res.status(200).json(await deleteFilterService(req.params.id))
);

module.exports = {
  searchFilters,
  createFilter,
  updateFilter,
  updateMultipleFilters,
  deleteFilter,
};
