const mongoose = require("mongoose");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const { sanitizeFilterQuery } = require("../utils/extraHelpers");
const { ROLES } = require("../config/general");

const canAccessAllProducts = (user) => {
  // Assuming the user's roles are in an array user.roles and contain objects with a type property
  const userRoles = user.roles;
  // ADMIN and SITE_MODERATOR have access to all products
  return (
    userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SITE_MODERATOR)
  );
};

const canAccessUnlistedProducts = (user) => {
  return user.roles.some((role) =>
    [
      ROLES.ADMIN,
      ROLES.SITE_MODERATOR,
      ROLES.CLUB_MODERATOR,
      ROLES.CLUB_OWNER,
    ].some((r) => r === role)
  );
};

// Implementation of the getProductsService function
const getProductsService = async (filterAndSortOptions, user) => {
  // Sanitize input options to prevent MongoDB injection
  const sanitizedOptions = sanitizeFilterQuery(filterAndSortOptions);

  // Construct the filter query based on the user's role
  let filterQuery = {};

  // If the user has club-specific roles, filter by in-house products or products owned by the user's club
  if (!canAccessAllProducts(user)) {
    filterQuery.$or = [
      { isHouseProduct: true },
      { ownerClub: mongoose.Types.ObjectId(user.club) },
    ];
    if (!canAccessUnlistedProducts(user)) {
      filterQuery.listed = true;
    }
  }

  // Apply sanitized filter options
  Object.assign(filterQuery, sanitizedOptions.filter);

  const sortOptions = sanitizedOptions.sort || {};

  try {
    const products = await Product.find(filterQuery).sort(sortOptions);
    return products;
  } catch (error) {
    console.error("Failed to get products:", error);
    throw error; // Adjust error handling as needed
  }
};

// Gets a specific product by ID
const getProductService = async (productId, user) => {
  try {
    // If the user can access all products, fetch the product directly
    if (canAccessAllProducts(user)) {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }
      return product;
    } else {
      // If the user has restricted access, find the product with conditions
      const conditions = {
        _id: productId,
        $or: [
          { isHouseProduct: true }, // In-house product
          { ownerClub: user.club }, // Or products owned by the user's club
        ],
      };
      if (!canAccessUnlistedProducts) conditions.listed = true;
      const product = await Product.findOne(conditions);

      if (!product) {
        throw new Error("Product not found or access denied");
      }
      return product;
    }
  } catch (err) {
    throw new Error(`Error fetching product: ${err.message}`);
  }
};

// Creates a new product
const createProductService = async (productData, user) => {
  try {
    // Determine if the user's roles require modifying `ownerClub` and setting `listed` to false
    const mustModifyClubAndListed = user.roles.some((role) =>
      [ROLES.CLUB_OWNER, ROLES.CLUB_MODERATOR].includes(role.type)
    );

    if (mustModifyClubAndListed) {
      // For users with roles that must modify, set `ownerClub` to the user's club and `listed` to false
      productData.ownerClub = user.club;
      productData.listed = false;
      productData.isHouseProduct = false;
    }

    // Create a new product with the given data
    const newProduct = new Product(productData);

    // Save the product to the database
    await newProduct.save();

    // Return the saved product
    return newProduct;
  } catch (error) {
    console.error("Error creating the product:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
};
const updateProductService = async (productId, productUpdates, user) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    // Fetch the product to check its details
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const canUpdateProduct = (() => {
      // Admin can update any product
      if (user.roles.includes(ROLES.ADMIN)) {
        return true;
      }

      // Check if the product belongs to the user's club (for club owner/moderator/site moderator)
      if (
        product.ownerClub &&
        user.club.equals(product.ownerClub.toString()) &&
        user.roles.some((role) =>
          [
            ROLES.CLUB_OWNER,
            ROLES.SITE_MODERATOR,
            ROLES.CLUB_MODERATOR,
          ].includes(role.type)
        )
      ) {
        return true;
      }

      return false;
    })();

    if (!canUpdateProduct) {
      throw new Error("Not authorized to update this product");
    }

    // Prevent updating restricted fields unless the user is an admin
    if (!user.roles.includes(ROLES.ADMIN)) {
      delete productUpdates.ownerClub;
      delete productUpdates.listed;
      delete productUpdates.isHouseProduct;
    }
    ["price", "priceHistory", "stock", "stockTransactions"].forEach(
      (key) => delete productUpdates[key]
    );

    // Perform the update
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      productUpdates,
      { new: true }
    ).lean();

    if (!updatedProduct) {
      throw new Error("Unable to update the product");
    }

    return updatedProduct;
  } catch (error) {
    console.error("Error updating the product:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

const deleteProductService = async (productId, user) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID");
  }

  // Fetch the product to get its details
  const product = await Product.findById(productId).populate("ownerClub");
  if (!product) {
    throw new Error("Product not found");
  }

  const canDelete = (() => {
    // Admin can delete any product
    if (user.roles.includes(ROLES.ADMIN)) {
      return true;
    }

    // Only admin can delete an in-house product
    if (product.isHouseProduct) {
      return false;
    }

    // Site moderators can delete any non in-house product
    if (user.roles.includes(ROLES.SITE_MODERATOR)) {
      return true;
    }

    // Club owners can delete products belonging to their club
    if (
      user.roles.includes(ROLES.CLUB_OWNER) &&
      product.ownerClub &&
      product.ownerClub._id.equals(user.club)
    ) {
      return true;
    }

    // Default to no permission
    return false;
  })();

  if (!canDelete) {
    throw new Error("Not authorized to delete this product");
  }

  // If authorized, delete the product
  await Product.deleteOne({ _id: productId });
  return { message: "Product deleted successfully" };
};

const updateProductUnitPricesService = async (
  productId,
  unitPricesToUpdate,
  userId
) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  // Assuming user details are fetched and checked for permissions as before
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Check if the product is an in-house product
  const isHouseProduct = product.isHouseProduct;

  // Determine if the user has permission to update the price
  let hasPermission = false;

  if (isHouseProduct) {
    // For in-house products, only admin/site mod can update the price
    hasPermission = user.roles.some((role) =>
      [ROLES.ADMIN, ROLES.SITE_MODERATOR].includes(role.type)
    );
  } else {
    // For club products, only admin/site mod/club owner/club mod (with the correct club) can update the price
    hasPermission = user.roles.some(
      (role) =>
        [ROLES.ADMIN, ROLES.SITE_MODERATOR].includes(role.type) ||
        (product.ownerClub &&
          user.club &&
          product.ownerClub._id.equals(user.club._id) &&
          [ROLES.CLUB_OWNER, ROLES.CLUB_MODERATOR].includes(role.type))
    );
  }

  if (!hasPermission) {
    throw new Error(
      "User does not have permission to update the price of this product"
    );
  }

  // Update logic: Iterate over each input to determine action (add, update, remove)
  unitPricesToUpdate.forEach(({ action, grams, price }) => {
    switch (action) {
      case "add":
        // Add new unit price
        product.unitPrices.push({ grams, price });
        break;
      case "update":
        // Find and update existing unit price
        const indexToUpdate = product.unitPrices.findIndex(
          (up) => up.grams === grams
        );
        if (indexToUpdate !== -1) {
          product.unitPrices[indexToUpdate].price = price;
        } else {
          // Handle the case where the unit price doesn't exist
          throw new Error(
            `Unit price for ${grams} grams not found for update.`
          );
        }
        break;
      case "remove":
        // Remove unit price
        product.unitPrices = product.unitPrices.filter(
          (up) => up.grams !== grams
        );
        break;
      default:
        throw new Error("Invalid action specified.");
    }
  });

  // Record the change in the price history
  // This records the entire operation as a single entry for simplicity
  // You might want to adjust this logic based on how you wish to track history
  product.priceHistory.push({
    unitPrices: unitPricesToUpdate,
    user: userId,
  });

  await product.save();

  return product;
};

// Adds a stock transaction for a product
const addStockTransactionService = async (
  productId,
  transactionData,
  userId
) => {
  // Step 1: Find the product by productId and populate ownerClub to check ownership
  const product = await Product.findById(productId).populate("ownerClub");
  if (!product) {
    throw new Error("Product not found");
  }

  // Step 2: Fetch the user details from the database, including their roles
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Step 3: Determine if the user has permission to update the stock
  let hasPermission = false;

  if (product.isHouseProduct) {
    // For in-house products, only admin/site mod can update the stock
    hasPermission = user.roles.some((role) =>
      [ROLES.ADMIN, ROLES.SITE_MODERATOR].includes(role)
    );
  } else {
    // For club products, only admin/site mod/club owner/club mod can update the stock
    // This assumes that the role validation is sufficient without needing to check club membership
    // If club-specific validation is needed, it should be handled here
    hasPermission = user.roles.some((role) =>
      [
        ROLES.ADMIN,
        ROLES.SITE_MODERATOR,
        ROLES.CLUB_OWNER,
        ROLES.CLUB_MODERATOR,
      ].includes(role)
    );
  }

  if (!hasPermission) {
    throw new Error(
      "User does not have permission to update the stock of this product"
    );
  }

  // Step 4: If the user has permission, add the stock transaction and update the stock accordingly
  product.stockTransactions.push({
    ...transactionData,
    user: userId,
  });

  switch (transactionData.type) {
    case "add":
      product.stock += transactionData.quantity;
      break;
    case "remove":
      product.stock -= transactionData.quantity;
      break;
    case "override":
      product.stock = transactionData.quantity;
      break;
    default:
      throw new Error("Invalid transaction type");
  }

  if (product.stock < 0) {
    throw new Error("Stock cannot be negative");
  }

  // Step 5: Save the updated product
  await product.save();

  return product;
};

module.exports = {
  getProductsService,
  getProductService,
  createProductService,
  updateProductService,
  deleteProductService,
  updateProductUnitPricesService,
  addStockTransactionService,
};
