const asyncHandler = require("express-async-handler");
const {
  placeOrderService,
  getOrderService,
  getOrdersService,
  updateOrderStatusService,
  cancelOrderService,
  archiveOrderService,
} = require("../services/orderServices");

// Place a new order
const placeOrder = asyncHandler(async (req, res) => {
  const order = await placeOrderService(req.body, req.user);
  res.status(201).json(order);
});

// Get details of a specific order
// Assuming validation for user ownership or elevated roles happens at the service level
const getOrder = asyncHandler(async (req, res) => {
  const order = await getOrderService(req.params.orderId, req.user);
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  res.status(200).json(order);
});

// View all orders
const getOrders = asyncHandler(async (req, res) => {
  const orders = await getOrdersService(req.user);
  res.status(200).json(orders);
});

// Update the status of an order
const updateOrderStatus = asyncHandler(async (req, res) => {
  const updatedOrder = await updateOrderStatusService(
    req.params.orderId,
    req.body.status,
    req.user
  );
  if (!updatedOrder) {
    res.status(404).json({ message: "Order not found or permission denied" });
    return;
  }
  res.status(200).json(updatedOrder);
});

// Cancel an order
// Assuming a check that either the user owns the order or has elevated privileges happens in the service
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await cancelOrderService(req.params.orderId, req.user);
  if (!order) {
    res.status(404).json({ message: "Order not found or permission denied" });
    return;
  }
  res.status(200).json(order);
});

// Archive an order
// This operation is restricted to ADMIN and SITE_MODERATOR roles, assumed to be checked in the service layer
const archiveOrder = asyncHandler(async (req, res) => {
  const archivedOrder = await archiveOrderService(req.params.orderId, req.user);
  if (!archivedOrder) {
    res.status(404).json({ message: "Order not found or permission denied" });
    return;
  }
  res.status(200).json(archivedOrder);
});

module.exports = {
  placeOrder,
  getOrder,
  getOrders,
  updateOrderStatus,
  cancelOrder,
  archiveOrder,
};
