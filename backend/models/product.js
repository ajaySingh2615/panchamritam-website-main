const { pool } = require('../config/db');

class Product {
  static async findAll(limit = 20, offset = 0) {
    try {
      // Ensure limit and offset are integers
      limit = parseInt(limit, 10);
      offset = parseInt(offset, 10);
      
      // Use directly interpolated values instead of placeholders for LIMIT and OFFSET
      const [rows] = await pool.execute(
        `SELECT p.*, c.name as category_name 
         FROM Products p 
         LEFT JOIN Categories c ON p.category_id = c.category_id
         ORDER BY p.product_id DESC
         LIMIT ${limit} OFFSET ${offset}`
      );
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Count total products
  static async count() {
    try {
      console.log('Product.count called');
      const [rows] = await pool.execute('SELECT COUNT(*) as count FROM Products');
      console.log('Product count result:', rows[0].count);
      return rows[0].count;
    } catch (error) {
      console.error('Error in Product.count:', error);
      return 0; // Return 0 instead of throwing
    }
  }

  static async findById(productId) {
    try {
      console.log('Product findById called with ID:', productId, 'type:', typeof productId);
      
      // Ensure productId is properly formatted (convert string to number if needed)
      const id = parseInt(productId, 10);
      
      if (isNaN(id)) {
        console.error('Invalid product ID:', productId);
        return null;
      }
      
      const [rows] = await pool.execute(
        `SELECT p.*, c.name as category_name 
         FROM Products p 
         LEFT JOIN Categories c ON p.category_id = c.category_id
         WHERE p.product_id = ?`,
        [id]
      );
      
      console.log('Product findById query result:', rows.length > 0 ? 'Found' : 'Not found');
      return rows[0];
    } catch (error) {
      console.error('Error in Product.findById:', error);
      throw error;
    }
  }

  static async findBySku(sku) {
    try {
      if (!sku) {
        return null;
      }
      
      const [rows] = await pool.execute(
        `SELECT p.*, c.name as category_name 
         FROM Products p 
         LEFT JOIN Categories c ON p.category_id = c.category_id
         WHERE p.sku = ?`,
        [sku]
      );
      
      return rows[0];
    } catch (error) {
      console.error('Error in Product.findBySku:', error);
      throw error;
    }
  }

  static async findBySlug(slug) {
    try {
      if (!slug) {
        return null;
      }
      
      const [rows] = await pool.execute(
        `SELECT p.*, c.name as category_name 
         FROM Products p 
         LEFT JOIN Categories c ON p.category_id = c.category_id
         WHERE p.slug = ?`,
        [slug]
      );
      
      return rows[0];
    } catch (error) {
      console.error('Error in Product.findBySlug:', error);
      throw error;
    }
  }

  static async findByCategory(categoryId, limit = 20, offset = 0) {
    try {
      console.log('Finding products in category:', categoryId);
      
      // Ensure all parameters are valid
      const catId = parseInt(categoryId, 10);
      if (isNaN(catId)) {
        console.error('Invalid category ID:', categoryId);
        return [];
      }
      
      // Ensure limit and offset are integers
      limit = parseInt(limit, 10);
      offset = parseInt(offset, 10);
      
      console.log(`Search parameters: categoryId=${catId}, limit=${limit}, offset=${offset}`);
      
      // Use directly interpolated values instead of placeholders for LIMIT and OFFSET
      const [rows] = await pool.execute(
        `SELECT p.*, c.name as category_name 
         FROM Products p 
         LEFT JOIN Categories c ON p.category_id = c.category_id
         WHERE p.category_id = ?
         ORDER BY p.product_id DESC
         LIMIT ${limit} OFFSET ${offset}`,
        [catId]
      );
      
      console.log(`Found ${rows.length} products in category ${catId}`);
      if (rows.length === 0) {
        console.log('No products found in this category');
      } else {
        console.log('First product in category:', {
          id: rows[0].product_id,
          name: rows[0].name,
          category_id: rows[0].category_id
        });
      }
      
      return rows;
    } catch (error) {
      console.error('Error in findByCategory:', error);
      throw error;
    }
  }

  static async create(productData) {
    const { 
      name, 
      slug,
      description, 
      short_description,
      ingredients,
      shelf_life,
      storage_instructions,
      usage_instructions,
      price, 
      regular_price,
      cost_price,
      quantity, 
      min_stock_alert,
      unit_of_measurement,
      package_size,
      categoryId, 
      subcategory_id,
      brand,
      sku,
      barcode,
      imageUrl,
      gallery_images,
      video_url,
      meta_title,
      meta_description,
      free_shipping,
      shipping_time,
      warranty_period,
      weight_for_shipping,
      dimensions,
      delivery_time_estimate,
      is_returnable,
      is_cod_available,
      eco_friendly,
      eco_friendly_details,
      tags,
      is_featured,
      is_best_seller,
      is_new_arrival,
      status,
      createdBy 
    } = productData;
    
    try {
      // Helper functions for safe type conversion
      const safeParseFloat = (value) => {
        if (value === null || value === undefined || value === '') return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      };
      
      const safeParseInt = (value) => {
        if (value === null || value === undefined || value === '') return null;
        const num = parseInt(value, 10);
        return isNaN(num) ? null : num;
      };
      
      // Generate slug if not provided
      const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
      
      const [result] = await pool.execute(
        `INSERT INTO Products 
         (name, slug, description, short_description, ingredients, shelf_life, 
          storage_instructions, usage_instructions, price, regular_price, cost_price, 
          quantity, min_stock_alert, unit_of_measurement, package_size, category_id, 
          subcategory_id, brand, sku, barcode, image_url, gallery_images, video_url, 
          meta_title, meta_description, free_shipping, shipping_time, warranty_period, 
          weight_for_shipping, dimensions, delivery_time_estimate, is_returnable, 
          is_cod_available, eco_friendly, eco_friendly_details, tags, is_featured, 
          is_best_seller, is_new_arrival, status, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, 
          productSlug,
          description, 
          short_description || (description ? description.substring(0, 150) : null),
          ingredients || null,
          shelf_life || null,
          storage_instructions || null,
          usage_instructions || null,
          safeParseFloat(price) || 0, 
          safeParseFloat(regular_price) || safeParseFloat(price) || 0, 
          safeParseFloat(cost_price),
          safeParseInt(quantity) || 0, 
          safeParseInt(min_stock_alert) || 5,
          unit_of_measurement || null,
          package_size || null,
          categoryId, 
          safeParseInt(subcategory_id),
          brand || 'GreenMagic', 
          sku || `GM-${Date.now()}`, 
          barcode || null,
          imageUrl,
          gallery_images ? JSON.stringify(gallery_images) : null,
          video_url || null,
          meta_title || name,
          meta_description || short_description || null,
          free_shipping ? 1 : 0, 
          shipping_time || '3-5 business days', 
          safeParseInt(warranty_period), 
          safeParseFloat(weight_for_shipping),
          dimensions || null,
          delivery_time_estimate || '3-5 business days',
          is_returnable === false ? 0 : 1,
          is_cod_available === false ? 0 : 1,
          eco_friendly ? 1 : 0, 
          eco_friendly_details || 'Eco-friendly packaging', 
          tags || '', 
          is_featured ? 1 : 0,
          is_best_seller ? 1 : 0,
          is_new_arrival ? 1 : 0,
          status || 'active', 
          createdBy
        ]
      );
      
      return {
        productId: result.insertId,
        ...productData,
        slug: productSlug
      };
    } catch (error) {
      console.error('Error in Product.create:', error);
      throw error;
    }
  }

  static async update(productId, productData) {
    try {
      const updateFields = [];
      const updateValues = [];
      
      // Dynamically build the update query based on provided fields
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined) {
          // Convert camelCase to snake_case
          const field = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          updateFields.push(`${field} = ?`);
          updateValues.push(value);
        }
      });
      
      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }
      
      // Add productId to the end of values array
      updateValues.push(productId);
      
      const [result] = await pool.execute(
        `UPDATE Products SET ${updateFields.join(', ')} WHERE product_id = ?`,
        updateValues
      );
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return { productId, ...productData };
    } catch (error) {
      throw error;
    }
  }

  static async delete(productId) {
    try {
      // Check if product is in any carts
      const [cartItems] = await pool.execute(
        'SELECT COUNT(*) as count FROM Cart_Items WHERE product_id = ?',
        [productId]
      );
      
      if (cartItems[0].count > 0) {
        throw new Error('Cannot delete product that is in customers carts');
      }
      
      // Check if product is in any orders
      const [orderItems] = await pool.execute(
        'SELECT COUNT(*) as count FROM Order_Items WHERE product_id = ?',
        [productId]
      );
      
      if (orderItems[0].count > 0) {
        throw new Error('Cannot delete product that has been ordered');
      }
      
      const [result] = await pool.execute(
        'DELETE FROM Products WHERE product_id = ?',
        [productId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async search(query, limit = 20, offset = 0) {
    try {
      // Ensure limit and offset are integers
      limit = parseInt(limit, 10);
      offset = parseInt(offset, 10);
      
      const searchTerm = `%${query}%`;
      
      // Use directly interpolated values instead of placeholders for LIMIT and OFFSET
      const [rows] = await pool.execute(
        `SELECT p.*, c.name as category_name
         FROM Products p
         LEFT JOIN Categories c ON p.category_id = c.category_id
         WHERE p.name LIKE ? OR p.description LIKE ?
         ORDER BY p.product_id DESC
         LIMIT ${limit} OFFSET ${offset}`,
        [searchTerm, searchTerm]
      );
      
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Product; 