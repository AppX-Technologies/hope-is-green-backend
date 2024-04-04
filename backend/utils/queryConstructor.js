const { isValidMongooseId } = require("./extraHelpers");

const constructQuery = (arr, fieldName) => {
  // Normalize array elements to lowercase
  const normalizedArr = arr.map((value) => value?.toString().toLowerCase());

  // Check for special cases
  const hasOther =
    normalizedArr.includes("other") || normalizedArr.includes("others");
  const hasUnassigned = normalizedArr.includes("unassigned");

  // Remove special cases from array
  ["other", "others", "unassigned"].forEach((specialValue) => {
    const index = normalizedArr.indexOf(specialValue);
    if (index !== -1) {
      arr.splice(index, 1);
      normalizedArr.splice(index, 1);
    }
  });

  // Build query
  let query = {};

  if (hasUnassigned) {
    query = { $exists: false };
  }

  if (hasOther) {
    if (Object.keys(query).length !== 0) {
      query = { $or: [query, { $nin: arr }] };
    } else {
      query = undefined;
    }
  } else {
    if (Object.keys(query).length !== 0) {
      query = { $or: [query, { $in: arr }] };
    } else {
      query = { $in: arr };
    }
  }

  return query;
};

function escapeRegex(string) {
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function constructRegexQuery(query = "") {
  const safeQuery = escapeRegex(query.trim());
  const regex = { $regex: safeQuery, $options: "i" }; // case-insensitive prefix search

  return regex;
}

function constructSearchQuery(fields, query) {
  const regex = constructRegexQuery(query);
  // Construct $or array with regex for each field
  const orArray = fields.map((field) => ({ [field]: regex }));

  return { $or: orArray };
}

const constructDateRangeQuery = (field, value) => {
  let { start, end } = value;

  // Helper function to adjust the date to the beginning or end of the day
  const adjustDate = (date, startOfDay) => {
    const newDate = new Date(date);
    if (startOfDay) {
      newDate.setHours(0, 0, 0, 0); // Set to start of the day
    } else {
      newDate.setHours(23, 59, 59, 999); // Set to end of the day
    }
    return newDate;
  };

  // If neither start nor end is present, return null
  if (!start && !end) return null;

  // Adjust start and end dates
  start = start ? adjustDate(start, true) : adjustDate(end, true);
  end = end ? adjustDate(end, false) : adjustDate(start, false);

  return {
    [field]: {
      $gte: start,
      $lte: end,
    },
  };
};

const getSortAndFilterQueryFromRequest = (sortOptions, filterValues = []) => {
  const objectToReturn = {};
  const keyMap = {
    lastInboundDate: "inbounds.date",
  };

  if (sortOptions) {
    let key = keyMap[sortOptions.key] || sortOptions.key;
    objectToReturn.sort = {
      [key]: sortOptions.order === "asc" ? 1 : -1,
    };
  }

  if (filterValues.length) {
    let dateFields = ["createdAt", "inbounds.date", "followupDate"];

    const filters = filterValues
      .map(({ key, value }) => {
        if (!value) return null;

        let keyToUse = keyMap[key] || key;

        if (dateFields.includes(keyToUse)) {
          return constructDateRangeQuery(keyToUse, value);
        }

        if (Array.isArray(value)) {
          return value.length ? { [keyToUse]: { $in: value } } : null;
        }

        if (isValidMongooseId(value)) {
          return { [keyToUse]: value };
        }

        const regexSearchQuery = constructRegexQuery(value);

        if (keyToUse === "comments") {
          return { [`comments.text`]: regexSearchQuery };
        }

        if (["phoneNumbers", "emails"].includes(keyToUse)) {
          return { [`${keyToUse}.0`]: regexSearchQuery };
        }

        if (keyToUse === "comments") {
          return { [`comments.text`]: regexSearchQuery };
        }

        if (keyToUse === "lastInboundSource") {
          return {
            $or: [
              { [`inbounds.sourceDetails.page_url`]: regexSearchQuery },
              { [`inbounds.sourceDetails.campaignName`]: regexSearchQuery },
              { [`inbounds.source`]: regexSearchQuery },
            ],
          };
        }

        return { [keyToUse]: regexSearchQuery };
      })
      .filter(Boolean);

    if (filters.length > 0) {
      objectToReturn.filter = {
        $and: filters,
      };
    }
  }

  return objectToReturn;
};

function getMongooseFilterFromFilterPreset(filterPreset) {
  // Base case: If the preset is an individual filter
  if (filterPreset.field) {
    switch (filterPreset.operator) {
      case "equals":
        return { [filterPreset.field]: filterPreset.value };
      case "in":
        return { [filterPreset.field]: { $in: filterPreset.value } };
      case "notIn":
        return { [filterPreset.field]: { $nin: filterPreset.value } };
      // Add other operators as needed
      default:
        throw new Error(`Unsupported operator: ${filterPreset.operator}`);
    }
  }

  // Recursive case: If the preset is a compound filter
  if (
    filterPreset.type &&
    filterPreset.filters &&
    filterPreset.filters.length > 0
  ) {
    const mongoOperators = filterPreset.type === "AND" ? "$and" : "$or";
    const subFilters = filterPreset.filters.map(
      getMongooseFilterFromFilterPreset
    );
    return { [mongoOperators]: subFilters };
  }

  throw new Error("Invalid filter preset structure");
}

module.exports = {
  constructQuery,
  constructSearchQuery,
  getSortAndFilterQueryFromRequest,
  getMongooseFilterFromFilterPreset,
};
