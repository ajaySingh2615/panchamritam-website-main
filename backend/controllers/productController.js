const Product = require('../models/product');
const Category = require('../models/category');
const { AppError } = require('../middlewares/errorHandler');

// Get all products with pagination
exports.getAllProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    let products;
    
    // Check if category filter is applied
    if (req.query.category) {
      const categoryId = req.query.category;
      
      // Verify category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        return next(new AppError('Category not found', 404));
      }
      
      // Get products filtered by category
      products = await Product.findByCategory(categoryId, limit, offset);
    } else {
      // Get all products without category filter
      products = await Product.findAll(limit, offset);
    }
    
    res.status(200).json({
      status: 'success',
      results: products.length,
      pagination: {
        page,
        limit,
        hasMore: products.length === limit
      },
      data: {
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get product by ID
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('Product controller getProductById called with ID:', id);
    
    // Validate ID
    if (!id) {
      console.error('No product ID provided in request params');
      return next(new AppError('Product ID is required', 400));
    }
    
    const product = await Product.findById(id);
    console.log('Product lookup result:', product ? 'Found' : 'Not found');
    
    if (!product) {
      console.error('Product not found for ID:', id);
      return next(new AppError('Product not found', 404));
    }
    
    // Log the product being returned
    console.log('Returning product with ID:', product.product_id);
    
    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Error in getProductById controller:', error);
    next(error);
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }
    
    const products = await Product.findByCategory(categoryId, limit, offset);
    
    res.status(200).json({
      status: 'success',
      results: products.length,
      pagination: {
        page,
        limit,
        hasMore: products.length === limit
      },
      data: {
        category,
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new product (admin only)
exports.createProduct = async (req, res, next) => {
  try {
    const { 
      name, 
      description,
      short_description,
      price, 
      regular_price,
      quantity, 
      categoryId,
      brand,
      sku,
      imageUrl,
      free_shipping,
      shipping_time,
      warranty_period,
      eco_friendly,
      eco_friendly_details,
      tags,
      is_featured,
      status
    } = req.body;
    
    // Validation
    if (!name || !price || !categoryId) {
      return next(new AppError('Name, price, and category ID are required', 400));
    }
    
    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }
    
    // Check if SKU exists
    if (sku) {
      const existingSku = await Product.findBySku(sku);
      if (existingSku) {
        return next(new AppError('SKU already exists', 400));
      }
    }
    
    // Create product with all fields
    const newProduct = await Product.create({
      name,
      description,
      short_description: short_description || (description ? description.substring(0, 150) : null),
      price,
      regular_price: regular_price || price,
      quantity: quantity || 0,
      categoryId,
      brand: brand || 'GreenMagic',
      sku: sku || `GM-${Date.now()}`, // Generate unique SKU if not provided
      imageUrl: imageUrl || null,
      free_shipping: free_shipping || false,
      shipping_time: shipping_time || '3-5 business days',
      warranty_period: warranty_period || null,
      eco_friendly: eco_friendly !== undefined ? eco_friendly : true,
      eco_friendly_details: eco_friendly_details || 'Eco-friendly packaging',
      tags: tags || '',
      is_featured: is_featured || false,
      status: status || 'active',
      createdBy: req.user.user_id
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        product: {
          ...newProduct,
          category_name: category.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update product (admin only)
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      short_description,
      price, 
      regular_price,
      quantity, 
      categoryId, 
      brand,
      sku,
      imageUrl,
      free_shipping,
      shipping_time,
      warranty_period,
      eco_friendly,
      eco_friendly_details,
      rating,
      review_count,
      tags,
      is_featured,
      status
    } = req.body;
    
    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }
    
    // Check if category exists if provided
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return next(new AppError('Category not found', 404));
      }
    }
    
    // If updating SKU, check it doesn't conflict
    if (sku && sku !== product.sku) {
      const existingSku = await Product.findBySku(sku);
      if (existingSku && existingSku.product_id !== parseInt(id)) {
        return next(new AppError('SKU already exists', 400));
      }
    }
    
    // Prepare update data with all fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (short_description !== undefined) updateData.short_description = short_description;
    if (price !== undefined) updateData.price = price;
    if (regular_price !== undefined) updateData.regular_price = regular_price;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (brand !== undefined) updateData.brand = brand;
    if (sku !== undefined) updateData.sku = sku;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (free_shipping !== undefined) updateData.free_shipping = free_shipping;
    if (shipping_time !== undefined) updateData.shipping_time = shipping_time;
    if (warranty_period !== undefined) updateData.warranty_period = warranty_period;
    if (eco_friendly !== undefined) updateData.eco_friendly = eco_friendly;
    if (eco_friendly_details !== undefined) updateData.eco_friendly_details = eco_friendly_details;
    if (rating !== undefined) updateData.rating = rating;
    if (review_count !== undefined) updateData.review_count = review_count;
    if (tags !== undefined) updateData.tags = tags;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (status !== undefined) updateData.status = status;
    
    // Update product
    const updatedProduct = await Product.update(id, updateData);
    
    res.status(200).json({
      status: 'success',
      data: {
        product: updatedProduct
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete product (admin only)
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Product.delete(id);
    
    if (!deleted) {
      return next(new AppError('Product not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('Cannot delete product')) {
      return next(new AppError(error.message, 400));
    }
    next(error);
  }
};

// Search products
exports.searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return next(new AppError('Search query is required', 400));
    }
    
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    const products = await Product.search(q, limit, offset);
    
    res.status(200).json({
      status: 'success',
      results: products.length,
      pagination: {
        page,
        limit,
        hasMore: products.length === limit
      },
      data: {
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get related products
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('Fetching related products for product ID:', id);
    
    // DEBUG: Get all products to see what we have in the database
    try {
      const allProducts = await Product.findAll(100, 0); // Get up to 100 products
      console.log('DEBUG - All products in database:', allProducts.map(p => ({
        id: p.product_id,
        name: p.name,
        category_id: p.category_id
      })));
    } catch (debugError) {
      console.error('Debug error fetching all products:', debugError);
    }
    
    // Get the current product to find its category
    const product = await Product.findById(id);
    
    if (!product) {
      console.error('Current product not found with ID:', id);
      return next(new AppError('Product not found', 404));
    }
    
    console.log('Current product details:', {
      id: product.product_id,
      name: product.name,
      category_id: product.category_id
    });
    
    // Get products from the same category, excluding the current product
    const limit = parseInt(req.query.limit) || 4; // Default to 4 related products
    const categoryId = product.category_id;
    
    if (!categoryId) {
      console.error('No category ID found for product:', id);
      return next(new AppError('Product has no category', 400));
    }
    
    console.log('Fetching related products from category:', categoryId);
    
    // Get all products from this category
    const allCategoryProducts = await Product.findByCategory(categoryId, 20, 0);
    console.log(`Found ${allCategoryProducts.length} products in category ${categoryId}`);
    
    if (allCategoryProducts.length === 0) {
      console.log('No products found in this category');
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: {
          products: []
        }
      });
    }
    
    // Log all products in the category for debugging
    console.log('Category products:', allCategoryProducts.map(p => ({
      id: p.product_id,
      name: p.name,
      currentProduct: p.product_id === parseInt(id)
    })));
    
    // Filter out the current product and limit the results
    const relatedProducts = allCategoryProducts
      .filter(p => p.product_id !== parseInt(id))
      .slice(0, limit);
    
    console.log(`Found ${relatedProducts.length} related products after filtering`);
    console.log('Related products:', relatedProducts.map(p => ({
      id: p.product_id, 
      name: p.name
    })));
    
    res.status(200).json({
      status: 'success',
      results: relatedProducts.length,
      data: {
        products: relatedProducts
      }
    });
  } catch (error) {
    console.error('Error in getRelatedProducts controller:', error);
    next(error);
  }
}; 