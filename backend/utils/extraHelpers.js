const mongoose = require("mongoose");

const generateFileURL = (fileName) =>
  `${process.env.BASEURL}/files/stream/${fileName}`;

const splitFullName = (fullName = "") => {
  if (!fullName) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const names = fullName.trim().split(" ");
  if (names.length === 1) {
    // If there's only one name, treat it as the first name
    return {
      firstName: names[0],
      lastName: "",
    };
  } else {
    // The first element is the first name
    return {
      firstName: names[0],
      // Join all elements except the first one as the last name
      lastName: names.slice(1).join(" "),
    };
  }
};

const formatUrl = (url) => {
  if (!url) return url;

  // Remove http:// or https://
  url = url.replace(/^https?:\/\//, "");

  // Remove any URL parameters by cutting off at the first '?'
  url = url.split("?")[0];

  // Remove trailing slash
  url = url.replace(/\/$/, "");

  return url;
};

const removeDuplicates = (arr = []) => {
  return arr.filter((value, index) => arr.indexOf(value) === index);
};

const generateAlphanumericString = (length, prefix = "") => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return prefix + result;
};

const cleanPhoneNumber = (num = "") => {
  if (!num) return;
  // Replace leading '+972' or '972' with 0
  num = num.trim().replace(/^(\+972|972)/, "0");

  // Remove leading '0' if number has 11 characters
  if (num.length === 11 && num.startsWith("0")) {
    num = num.slice(1);
  }

  return num;
};

function isValidMongooseId(str) {
  return mongoose.Types.ObjectId.isValid(str);
}

// Sanitize filter options to prevent MongoDB injection
const sanitizeFilterQuery = (options) => {
  const sanitized = JSON.stringify(options).replace(/[\$\{\}\[\]\/]/g, "");
  return JSON.parse(sanitized);
};

module.exports = {
  generateFileURL,
  splitFullName,
  formatUrl,
  removeDuplicates,
  generateAlphanumericString,
  cleanPhoneNumber,
  isValidMongooseId,
  sanitizeFilterQuery,
};
