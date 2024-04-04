const isMongoId = (str) => /^[a-f\d]{24}$/i.test(str);

const generateChangesFromDiff = (historyObj, ignorePaths = []) => {
  ignorePaths.push("updatedAt");
  // Sort history by updatedAt in descending order (latest change first)
  historyObj.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return historyObj.reduce((result, diffObj) => {
    let changeObj = {};
    changeObj.name = diffObj?.user?.name || "Unknown";
    changeObj.email = diffObj?.user?.email || "Unknown";
    changeObj.role = diffObj?.user?.role || "Unknown";
    changeObj.timestamp = new Date(diffObj.updatedAt).toISOString();
    changeObj.changes = [];

    for (let key in diffObj.diff) {
      // if key is in ignorePaths, skip
      if (ignorePaths.includes(key)) continue;

      let fromValue, toValue, arrayActions;

      // Check if this is a complex array update operation
      if (
        diffObj.diff[key] &&
        typeof diffObj.diff[key] === "object" &&
        !Array.isArray(diffObj.diff[key]) &&
        diffObj.diff[key]["_t"] === "a"
      ) {
        const diffObject = diffObj?.diff[key] || {};
        const keys = Object.keys(diffObject).filter((k) => k !== "_t");
        const newIndexes = keys.filter((k) => !k.startsWith("_"));
        const oldIndexKeys = keys.filter((k) => k.startsWith("_"));

        const oldIndexes = oldIndexKeys.map((k) => k.replace("_", ""));

        const indexesAdded = newIndexes.filter((k) => !oldIndexes.includes(k));
        const indexesUpdated = newIndexes.filter((k) => oldIndexes.includes(k));
        const indexesRemoved = oldIndexes.filter(
          (k) => !newIndexes.includes(k)
        );

        arrayActions = {
          added: indexesAdded.map((i) => diffObject[i][0]),
          updated: indexesUpdated.map((i) => ({
            oldValue: diffObject[`_${i}`][0],
            newValue: diffObject[i][0],
          })),
          removed: indexesRemoved.map((i) => diffObject[`_${i}`][0]),
        };
      }
      // If value is an array, get the new and old value
      // If not, it means value is added or removed
      else if (Array.isArray(diffObj.diff[key])) {
        fromValue = diffObj.diff[key][0]; // New value
        toValue = diffObj.diff[key][1]; // Old value
      } else {
        // If only one value exists, it's a new value added
        fromValue = diffObj.diff[key]; // New value
        toValue = null; // Old value doesn't exist
      }

      if (isMongoId(fromValue?.toString()) || isMongoId(toValue?.toString())) {
        // if either value is objectId, ignore them
        fromValue = undefined;
        toValue = undefined;
      }

      changeObj.changes.push({
        fieldName: key,
        fromValue: fromValue,
        toValue: toValue,
        arrayActions,
      });
    }

    // only push to result if changes array is not empty
    if (changeObj.changes.length) {
      result.push(changeObj);
    }

    return result;
  }, []);
};

module.exports = generateChangesFromDiff;
