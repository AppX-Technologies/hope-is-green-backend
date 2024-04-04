const express = require("express");
const router = express.Router();
const {
  placeOrder,
  getOrder,
  getOrders,
  updateOrderStatus,
  cancelOrder,
  archiveOrder,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const { ROLES } = require("../config/general");

// Roles for accessing and managing orders
const adminSiteModsClubLeaders = [
  ROLES.ADMIN,
  ROLES.SITE_MODERATOR,
  ROLES.CLUB_ADMIN,
  ROLES.CLUB_MODERATOR,
];
const allRoles = [...adminSiteModsClubLeaders, ROLES.CLUB_MEMBER];

// Place a new order (accessible by CLUB_MEMBER and above)
router.route("/").post(protect(allRoles), placeOrder);

// Get details of a specific order
// Assuming a CLUB_MEMBER can only access their own orders
router.route("/:orderId").get(protect(allRoles), getOrder);

// View all orders - restricted to admin, site moderators, and club leaders (both admin and moderator)
router.route("/list").get(protect(adminSiteModsClubLeaders), getOrders);

// Update the status of an order (e.g., marking an order as finished) - Available to club leaders and higher privileges
router
  .route("/:orderId/status")
  .put(protect(adminSiteModsClubLeaders), updateOrderStatus);

// Cancel an order - Available to the order's owner (CLUB_MEMBER) and higher roles, including club leaders
router.route("/:orderId/cancel").put(protect(allRoles), cancelOrder);

// Archive an order - Restricted to ADMIN and SITE_MODERATOR roles
router
  .route("/:orderId/archive")
  .put(protect([ROLES.ADMIN, ROLES.SITE_MODERATOR]), archiveOrder);

module.exports = router;
