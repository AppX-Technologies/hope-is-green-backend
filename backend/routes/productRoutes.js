const express = require("express");
const router = express.Router();
const {
  getProduct,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductPrice,
  addStockTransaction,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const { ROLES } = require("../config/general");

// Roles grouping for more granular control
const adminAndModerators = [ROLES.ADMIN, ROLES.SITE_MODERATOR];
const clubLeaders = [ROLES.CLUB_ADMIN, ROLES.CLUB_MODERATOR];
const viewingRoles = [...adminAndModerators, ROLES.CLUB_MEMBER]; // Roles allowed to view general product info and price history

// Product routes
router
  .route("/")
  .get(protect(viewingRoles), getProducts) // List all products, accessible by all viewingRoles
  .post(protect([...adminAndModerators, ...clubLeaders]), createProduct); // Create a new product, restricted to adminAndModerators

router
  .route("/:productId")
  .get(protect(viewingRoles), getProduct) // Get a specific product, accessible by all viewingRoles
  .put(protect([...adminAndModerators, ...clubLeaders]), updateProduct) // Update a specific product, restricted to admin, moderators, and club leaders
  .delete(protect(adminAndModerators), deleteProduct); // Delete a specific product, restricted to adminAndModerators

// Price management
router
  .route("/:productId/price")
  .put(protect([...adminAndModerators, ...clubLeaders]), updateProductPrice); // Update price of a specific product, restricted to admin, moderators, and club leaders

// Stock management (more restricted)
router
  .route("/:productId/stockTransactions")
  .post(protect([...adminAndModerators, ...clubLeaders]), addStockTransaction); // Add a stock transaction, restricted to admin, moderators, and club leaders

module.exports = router;
