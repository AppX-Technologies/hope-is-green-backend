const searchFilterAndSort = (
  keyword,
  allObjects,
  searchParams,
  filterSchema,
  sortSchema,
  pageNumber = 1,
  pageSize = 10,
  fields = {}
) =>
  search(
    keyword,
    filterAndSort(allObjects, filterSchema, sortSchema),
    searchParams,
    pageNumber,
    pageSize,
    fields
  );

const search = (
  keyword,
  allObjects,
  searchParams,
  pageNumber = 1,
  pageSize = 100,
  fields = {}
) => {
  if (
    (keyword && typeof keyword !== "string") ||
    !Array.isArray(allObjects) ||
    !Array.isArray(searchParams)
  ) {
    throw new Error("Invalid arguments");
  }

  if (keyword && keyword.length < 3)
    throw new Error("Keyword should be at least 3 characters.");

  allObjects.forEach((obj) => (obj.relevance = 0));

  keyword &&
    allObjects.forEach((obj) =>
      searchParams.forEach(
        (param) =>
          (obj.relevance += getRelevance(
            getNestedProperty(obj, param),
            keyword
          ))
      )
    );

  const results = keyword
    ? allObjects.filter((obj) => obj.relevance > 0).sort(compareRelevance)
    : allObjects;

  const totalPages = Math.ceil(results.length / pageSize);
  const pagedResults = results.slice(
    (pageNumber - 1) * pageSize,
    pageNumber * pageSize
  );

  const processedResults = pagedResults.map((result) => {
    let cloneResult = JSON.parse(JSON.stringify(result)); // Create a deep copy of the result
    if (fields.include) {
      let includedObject = {};
      fields.include.forEach((field) => {
        const nestedProperty = getNestedProperty(cloneResult, field);
        if (nestedProperty !== undefined) {
          includedObject = setObjectProperty(
            includedObject,
            field,
            nestedProperty
          );
        }
      });
      return includedObject;
    } else if (fields.exclude) {
      fields.exclude.forEach((field) => {
        deleteNestedProperty(cloneResult, field);
      });
      return cloneResult;
    } else {
      return cloneResult;
    }
  });

  return {
    totalPages: totalPages,
    pageNumber: pageNumber,
    pageSize: pageSize,
    results: processedResults,
  };
};

const getRelevance = (value, keyword) => {
  if (
    value === undefined ||
    (typeof value !== "string" && typeof value !== "number")
  )
    return 0;

  value = value.toString().toLowerCase();
  keyword = keyword.toString().toLowerCase();

  const index = value.indexOf(keyword);
  const frequency = (value.match(new RegExp(keyword, "g")) || []).length;

  const isWholeWord =
    (index === 0 ||
      value[index - 1] === " " ||
      /[.,!?]/.test(value[index - 1])) &&
    (index + keyword.length === value.length ||
      value[index + keyword.length] === " " ||
      /[.,!?]/.test(value[index + keyword.length]));

  if (index === 0) {
    // Highest relevance: keyword matches the start of the string
    return 3 + frequency;
  } else if (isWholeWord) {
    // Medium relevance: keyword is a whole word in the string
    return 2 + frequency;
  } else if (index !== -1) {
    // Low relevance: keyword is a substring of the string
    // Bonus relevance for frequency of keyword and length of keyword relative to string
    return 1 + frequency + keyword.length / value.length;
  } else {
    // No matches, no relevance
    return 0;
  }
};

const compareRelevance = (a, b) => b.relevance - a.relevance;

//Object manipulation functions, relevant to both

const getNestedProperty = (obj, path) => {
  if (typeof obj !== "object" || obj === null || typeof path !== "string") {
    return undefined;
  }

  return path.split(".").reduce((prev, curr) => {
    if (curr.includes("[") && curr.includes("]")) {
      const key = curr.split("[")[0];
      const index = parseInt(curr.split("[")[1].split("]")[0]);
      return prev && prev[key] !== undefined ? prev[key][index] : undefined;
    }
    return prev && prev[curr] !== undefined ? prev[curr] : undefined;
  }, obj);
};

const setObjectProperty = (obj, path, value) => {
  const pathArray = path.split(".");
  let currentObj = obj;

  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i].includes("[")
      ? pathArray[i].split("[")[0]
      : pathArray[i];
    const index = pathArray[i].includes("[")
      ? parseInt(pathArray[i].split("[")[1].split("]")[0])
      : null;

    if (index !== null) {
      if (!currentObj[key]) {
        currentObj[key] = [];
      }
      if (!currentObj[key][index]) {
        currentObj[key][index] = {};
      }
      currentObj = currentObj[key][index];
    } else {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
  }

  const finalKey = pathArray[pathArray.length - 1].includes("[")
    ? pathArray[pathArray.length - 1].split("[")[0]
    : pathArray[pathArray.length - 1];
  const finalIndex = pathArray[pathArray.length - 1].includes("[")
    ? parseInt(pathArray[pathArray.length - 1].split("[")[1].split("]")[0])
    : null;

  if (finalIndex !== null) {
    if (!currentObj[finalKey]) {
      currentObj[finalKey] = [];
    }
    currentObj[finalKey][finalIndex] = value;
  } else {
    currentObj[finalKey] = value;
  }

  return obj;
};

const deleteNestedProperty = (obj, path) => {
  const pathArray = path.split(".");
  let currentObj = obj;

  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i].includes("[")
      ? pathArray[i].split("[")[0]
      : pathArray[i];
    const index = pathArray[i].includes("[")
      ? parseInt(pathArray[i].split("[")[1].split("]")[0])
      : null;

    if (index !== null && currentObj[key]) {
      currentObj = currentObj[key][index];
    } else if (currentObj[key]) {
      currentObj = currentObj[key];
    } else {
      return;
    }
  }

  const finalKey = pathArray[pathArray.length - 1].includes("[")
    ? pathArray[pathArray.length - 1].split("[")[0]
    : pathArray[pathArray.length - 1];
  const finalIndex = pathArray[pathArray.length - 1].includes("[")
    ? parseInt(pathArray[pathArray.length - 1].split("[")[1].split("]")[0])
    : null;

  if (finalIndex !== null && currentObj[finalKey]) {
    delete currentObj[finalKey][finalIndex];
  } else if (currentObj[finalKey]) {
    delete currentObj[finalKey];
  }
};

/*******************************************/

//Filter and sort related functions.

const filterAndSort = (data, filterSchema, sortSchema) => {
  if (!Array.isArray(data)) {
    throw new Error("Invalid data. It should be an array");
  }

  if (typeof filterSchema !== "object" || !filterSchema) {
    throw new Error("Invalid filter schema");
  }

  if (typeof sortSchema !== "object" || !sortSchema) {
    throw new Error("Invalid sort schema");
  }

  // Filter
  let filteredData = data.filter((item) => applyFilter(item, filterSchema));

  // Sort
  const sortKeys = Object.keys(sortSchema);
  filteredData = [...filteredData];
  filteredData.sort((a, b) => {
    for (let key of sortKeys) {
      if (sortSchema[key] !== "asc" && sortSchema[key] !== "desc") {
        throw new Error(
          `Invalid sort direction for ${key}. It must be 'asc' or 'desc'.`
        );
      }

      const dir = sortSchema[key] === "asc" ? 1 : -1;
      const aKey = getNestedProperty(a, key);
      const bKey = getNestedProperty(b, key);

      if (aKey === undefined || bKey === undefined) {
        throw new Error(`Key ${key} not found in the data`);
      }

      if (aKey < bKey) return -1 * dir;
      if (aKey > bKey) return 1 * dir;
    }
    return 0;
  });

  return filteredData;
};

const applyFilter = (item, schema) => {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    throw new Error("Invalid filter schema. It should be an object");
  }

  if ("$or" in schema) {
    if (!Array.isArray(schema["$or"])) {
      throw new Error("Invalid filter schema for $or. It should be an array");
    }
    // OR operation
    return schema["$or"].some((subFilter) => applyFilter(item, subFilter));
  } else if ("$and" in schema) {
    if (!Array.isArray(schema["$and"])) {
      throw new Error("Invalid filter schema for $and. It should be an array");
    }
    // AND operation
    return schema["$and"].every((subFilter) => applyFilter(item, subFilter));
  } else if ("type" in schema && "operator" in schema && "value" in schema) {
    if (!("field" in schema)) {
      throw new Error("Invalid filter condition. field property is missing");
    }
    // It's a filter condition
    let itemValue = getNestedProperty(item, schema.field);
    if (itemValue === undefined)
      return schema.operator === "equals" && schema.value === undefined;

    switch (schema.type) {
      case "number":
        itemValue = Number(itemValue);
        if (Number.isNaN(itemValue)) return schema.value === undefined;
        break;
      case "date":
        itemValue = new Date(itemValue).getTime();
        if (Number.isNaN(itemValue)) return schema.value === undefined;
        break;
      default:
        throw new Error(
          `Invalid type in filter condition. Received ${schema.type}`
        );
    }

    return checkCondition(
      schema.type,
      schema.operator,
      schema.value,
      itemValue
    );
  } else {
    // Assume AND operation if no keywords are present
    return Object.keys(schema).every((key) =>
      applyFilter(item, { field: key, ...schema[key] })
    );
  }
};

const checkCondition = (type, operator, value, itemValue) => {
  const validTypes = ["string", "number", "date", "array"];
  if (!validTypes.includes(type)) {
    throw new Error(
      `Invalid type ${type}. It must be one of ${validTypes.join(", ")}.`
    );
  }
  if (type === "string") {
    if (operator === "equals") return itemValue.toString() === value.toString();
    if (operator === "contains")
      return itemValue
        .toString()
        .toLowerCase()
        .includes(value.toString().toLowerCase());
  } else if (type === "number") {
    if (operator === "equals") return itemValue === Number(value);
    if (operator === "greater") return itemValue > Number(value);
    if (operator === "less") return itemValue < Number(value);
    if (operator === "between") {
      const [min, max] = value.map((x) => Number(x));
      return itemValue >= min && itemValue <= max;
    }
  } else if (type === "date") {
    const itemDate = itemValue;
    const valueDate = new Date(value).getTime();
    if (operator === "equals") return itemDate === valueDate;
    if (operator === "after") return itemDate > valueDate;
    if (operator === "before") return itemDate < valueDate;
    if (operator === "between") {
      const [startDate, endDate] = value.map((date) =>
        new Date(date).getTime()
      );
      return itemDate >= startDate && itemDate <= endDate;
    }
  } else if (type === "array") {
    if (operator === "sizeEquals") return itemValue.length === value;
    if (operator === "sizeGreaterThan") return itemValue.length > value;
    if (operator === "sizeLessThan") return itemValue.length < value;
    if (operator === "contains") return itemValue.includes(value);
  }
  return false;
};

module.exports = { searchFilterAndSort, search, filterAndSort };
