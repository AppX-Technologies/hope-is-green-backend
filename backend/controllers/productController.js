const asyncHandler = require("express-async-handler");
const {
  getProductService,
  getProductsService,
  createProductService,
  updateProductService,
  deleteProductService,
  updateProductUnitPricesService,
  addStockTransactionService,
} = require("../services/productServices");

// Get a list of all products
const getProducts = asyncHandler(async (req, res) => {
  const products = await getProductsService(req.body, req.user); // req.body = {filter, sort} which describe filters and sorting.
  res.status(200).json(products);
});

// Get a specific product by ID
const getProduct = asyncHandler(async (req, res) => {
  const product = await getProductService(req.params.productId, req.user);
  res.status(200).json(product);
});

// Create a new product
const createProduct = asyncHandler(async (req, res) => {
  const product = await createProductService(req.body, req.user);
  res.status(201).json(product);
});

// Update a specific product by ID
const updateProduct = asyncHandler(async (req, res) => {
  const updatedProduct = await updateProductService(
    req.params.productId,
    req.body,
    req.user
  );
  res.status(200).json(updatedProduct);
});

// Delete a specific product by ID
const deleteProduct = asyncHandler(async (req, res) => {
  await deleteProductService(req.params.productId, req.user);
  res.status(204).send();
});

const updateProductPrice = asyncHandler(async (req, res) => {
  // Extract the productId from the request parameters
  const { productId } = req.params;
  const unitPricesToUpdate = req.body.unitPrices;
  const userId = req.user._id; // Adjust according to how the user ID is stored/accessed

  // Call the updated service function with the correct arguments
  const updatedProduct = await updateProductUnitPricesService(
    productId,
    unitPricesToUpdate,
    userId
  );

  // Respond with the updated product
  res.status(200).json(updatedProduct);
});

// Add a stock transaction for a product
const addStockTransaction = asyncHandler(async (req, res) => {
  const stockTransaction = await addStockTransactionService(
    req.params.productId,
    req.body,
    req.user
  );
  res.status(201).json(stockTransaction);
});

module.exports = {
  getProduct,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductPrice,
  addStockTransaction,
};
