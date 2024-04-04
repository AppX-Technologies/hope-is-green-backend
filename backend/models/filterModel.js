const mongoose = require("mongoose");

// Define a schema for individual filters
const filterSchema = new mongoose.Schema({
  field: { type: String }, // Field name to apply the filter on
  operator: { type: String }, // Operator to use for filtering
  value: { type: mongoose.SchemaTypes.Mixed }, // Value for comparison; using Mixed to allow any type
  combinator: { type: String, enum: ["and", "or"], default: "and" }, // Type of logical operation (used for compound filters)
});

filterSchema.add({ rules: [filterSchema] });

const mainFilterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    static: { type: Boolean, default: false },
    index: {
      type: Number,
      required: true,
      default: 0,
    },
    filter: filterSchema,
    filterParsed: mongoose.SchemaTypes.Mixed,
  },
  { timestamps: true }
);

filterSchema.index({ index: 1 }); // Ascending order index

const modifyFiltersRecursively = (filter) => {
  if (filter.field) {
    // If `field` exists, focus on field, value, operator and remove combinator and rules
    filter.combinator = undefined;
    filter.rules = undefined;
  } else {
    // If `field` doesn't exist, focus on combinator and rules and remove field, value, operator
    filter.field = undefined;
    filter.value = undefined;
    filter.operator = undefined;
    if (filter.rules && Array.isArray(filter.rules)) {
      filter.rules.forEach((rule) => modifyFiltersRecursively(rule));
    }
  }
};

[
  "find",
  "findOne",
  "findById",
  "findOneAndUpdate",
  "findByIdAndUpdate",
  "updateOne",
  "updateMany",
].forEach((operation) => {
  mainFilterSchema.post(operation, function (docs) {
    if (Array.isArray(docs)) {
      docs.forEach((doc) => {
        if (doc.filter) modifyFiltersRecursively(doc.filter);
      });
    } else {
      if (docs && docs.filter) modifyFiltersRecursively(docs.filter);
    }
  });
});

mainFilterSchema.post("save", function (doc) {
  if (doc && doc.filter) modifyFiltersRecursively(doc.filter);
});

const Filter = mongoose.model("Filter", mainFilterSchema);
module.exports = Filter;
