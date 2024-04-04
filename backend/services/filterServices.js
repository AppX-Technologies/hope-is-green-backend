const asyncHandler = require("express-async-handler");

const Filter = require("../models/filterModel");

function validateFilter(filterData) {
  return;
}

const createFilterService = asyncHandler(async (filterData, user) => {
  filterData.__user = user; // Set the modifiedBy field with the user ID

  const error = validateFilter(filterData);
  if (error) {
    throw new Error(error);
  }

  const filter = await Filter.create(filterData);
  return filter;
});

const updateFilterService = asyncHandler(async (id, filterUpdates, user) => {
  const filter = await Filter.findById(id);
  if (!filter) {
    throw new Error("The filter was not found.");
  }

  Object.assign(filter, filterUpdates);
  filter.__user = user;

  const error = validateFilter(filter.toObject());
  if (error) {
    throw new Error(error);
  }

  await filter.save();

  const updatedFilter = await Filter.findById(filter._id);
  return updatedFilter;
});

const updateMultipleFiltersService = asyncHandler(
  async (filterUpdatesArray, user) => {
    const updatedFilters = [];
    const failedUpdates = [];

    for (const filterUpdate of filterUpdatesArray) {
      const { _id, filterUpdates } = filterUpdate;
      const filter = await Filter.findById(_id);
      if (!filter) {
        failedUpdates.push(_id);
        continue;
      }

      Object.assign(filter, { ...filterUpdates, __user: user });
      const updatedFilter = await filter.save();

      updatedFilters.push(updatedFilter);
    }

    return { updatedFilters, failedUpdates };
  }
);

const deleteFilterService = asyncHandler(async (id) => {
  const filter = await Filter.findById(id);
  if (!filter) {
    throw new Error("The filter was not found.");
  }

  await filter.remove();
  return { id };
});

module.exports = {
  createFilterService,
  updateFilterService,
  updateMultipleFiltersService,
  deleteFilterService,
};
