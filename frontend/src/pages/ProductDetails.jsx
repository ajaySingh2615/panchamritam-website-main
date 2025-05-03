import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import ReviewTabs from '../components/product/ReviewTabs';
import Breadcrumb from '../components/common/Breadcrumb';
import { API_ENDPOINTS } from '../config/api';
import './ProductDetails.css';

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const [isInCart, setIsInCart] = useState(false);

  // Check if product is already in cart
  useEffect(() => {
    if (product && cart) {
      const existingItem = cart.find(item => item.product_id === parseInt(productId));
      setIsInCart(!!existingItem);
    }
  }, [cart, productId, product]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const requestUrl = `${API_ENDPOINTS.PRODUCTS}/${productId}`;
        
        const response = await fetch(requestUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch product details: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Received non-JSON response from server');
        }

        const data = await response.json();
        
        // Try to extract product from different possible locations in the response
        let productData = null;
        
        if (data.data && data.data.product) {
          productData = data.data.product;
        } else if (data.product) {
          productData = data.product;
        } else if (data.data) {
          productData = data.data;
        }
        
        if (!productData) {
          throw new Error('Product not found in API response');
        }
        
        // From examining the backend schema, we see the actual fields in the database:
        // product_id, name, description, price, quantity, category_id, image_url, created_by, created_at
        // category_name is joined from the Categories table
        
        // We'll extend the product model with additional useful fields that could be added to the database later
        
        setProduct({
          ...productData,
          // Base fields from database mapped with consistent naming
          product_id: productData.product_id,
          name: productData.name,
          description: productData.description || 'No description available',
          price: parseFloat(productData.price || 0),
          quantity: parseInt(productData.quantity || 0),
          category_id: productData.category_id,
          category_name: productData.category_name || 'Uncategorized',
          image_url: productData.image_url,
          
          // Create images array if not available
          images: productData.images || [productData.image_url || '/placeholder-product.jpg'],
          
          // Stock information derived from quantity
          in_stock: productData.in_stock !== undefined 
            ? productData.in_stock 
            : (parseInt(productData.quantity || 0) > 0),
          stock_status: productData.stock_status || 
            (parseInt(productData.quantity || 0) > 5 
              ? 'In Stock' 
              : parseInt(productData.quantity || 0) > 0 
                ? 'Low Stock' 
                : 'Out of Stock'),
          
          // Additional product data that could be added to the database schema
          sku: productData.sku || `GM-${productData.product_id}`,
          brand: productData.brand || 'GreenMagic',
          short_description: productData.short_description || 
            (productData.description ? productData.description.substring(0, 150) + '...' : 'Experience the best natural products'),
          
          // Default shipping & policy information (could be from site settings or product-specific)
          free_shipping_threshold: 50, // Could be from site settings
          free_shipping: productData.free_shipping || false,
          shipping_time: productData.shipping_time || '3-5 business days',
          
          // Product guarantees
          money_back_guarantee: 30, // Could be from site settings
          warranty_period: productData.warranty_period || null,
          
          // Sustainability information (key for GreenMagic brand)
          eco_friendly: true, // Assuming all GreenMagic products are eco-friendly
          eco_friendly_details: 'Eco-friendly packaging and sustainably sourced',
          
          // Security information
          secure_checkout: true,
          
          // Features with default values aligned with GreenMagic's brand
          features: productData.features || [
            "100% authentic natural product",
            "Free shipping on orders over $50",
            "30-day money-back guarantee",
            "Eco-friendly packaging",
            "Sustainably sourced ingredients"
          ],
          
          // Review data placeholder (should be connected to a reviews API endpoint)
          rating: productData.rating || 4.5,
          review_count: productData.review_count || 0,
          
          // Regular price for discount calculation (could be added to DB schema)
          regular_price: productData.regular_price || productData.price,
          
          // Tags for related products and searching
          tags: productData.tags || productData.category_name || ''
        });
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError(err.message || 'Failed to load product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    } else {
      setError('No product ID provided');
      setLoading(false);
    }
  }, [productId]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (product?.quantity || 10)) {
      setQuantity(value);
    }
  };

  const increaseQuantity = () => {
    if (quantity < (product?.quantity || 10)) {
      setQuantity(prev => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (product && product.in_stock) {
      addToCart({ ...product, quantity });
      // Show confirmation instead of redirecting
      setIsInCart(true);
    }
  };

  const handleBuyNow = () => {
    if (product && product.in_stock) {
      addToCart({ ...product, quantity });
      navigate('/cart');
    }
  };

  // Handle image zoom
  const handleImageMouseMove = (e) => {
    if (!imageRef.current) return;

    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPosition({ x, y });
  };

  // Format price safely
  const formatPrice = (price) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : (typeof price === 'number' ? price : 0);
    return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
  };

  // Calculate discount percentage if sale_price exists
  const calculateDiscount = () => {
    if (!product || !product.regular_price || !product.price) return null;
    const regularPrice = parseFloat(product.regular_price);
    const salePrice = parseFloat(product.price);
    
    if (isNaN(regularPrice) || isNaN(salePrice) || regularPrice <= salePrice) return null;
    
    const discountPercent = Math.round(((regularPrice - salePrice) / regularPrice) * 100);
    return discountPercent;
  };

  if (loading) {
    return (
      <div className="product-details-page loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading amazing product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-page error">
        <div className="error-container">
          <p className="error-message">{error || 'Product not found'}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const discount = calculateDiscount();
  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: product.category_name || 'Category', path: `/shop?category=${product.category_id}` },
    { label: product.name, path: `/product/${product.product_id}` }
  ];

  // Create star rating display
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half-filled">★</span>);
      } else {
        stars.push(<span key={i} className="star">★</span>);
      }
    }
    
    return stars;
  };

  return (
    <div className="product-details-page">
      <div className="product-details-container">
        <Breadcrumb items={breadcrumbItems} />

        <div className="product-details-content">
          {/* Product Gallery Section */}
          <div className="product-gallery">
            <div 
              className={`main-image ${isImageZoomed ? 'zoomed' : ''}`}
              onMouseEnter={() => setIsImageZoomed(true)}
              onMouseLeave={() => setIsImageZoomed(false)}
              onMouseMove={handleImageMouseMove}
              ref={imageRef}
            >
              {discount && <span className="discount-badge">-{discount}%</span>}
              {product.eco_friendly && (
                <span className="eco-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Eco-Friendly
                </span>
              )}
              <img 
                src={product.images[selectedImage] || product.image_url || '/placeholder-product.jpg'} 
                alt={product.name}
                className="primary-image"
                style={isImageZoomed ? {
                  transform: 'scale(1.5)',
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                } : {}}
              />
            </div>
            <div className="thumbnail-list">
              {product.images?.map((image, index) => (
                <button
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image} alt={`${product.name} - ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="product-info">
            <h1 className="product-name">{product.name}</h1>
            
            <div className="product-rating">
              <div className="stars">
                {renderStarRating(product.rating)}
              </div>
              <a href="#reviews" className="review-count">
                {product.review_count > 0 ? `${product.review_count} Reviews` : 'Be the first to review'}
              </a>
              {product.in_stock ? (
                <span className="availability in-stock">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  {product.stock_status || 'In Stock'}
                </span>
              ) : (
                <span className="availability out-of-stock">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  {product.stock_status || 'Out of Stock'}
                </span>
              )}
            </div>
            
            <div className="product-price">
              {discount ? (
                <>
                  <span className="regular-price">${formatPrice(product.regular_price)}</span>
                  <span className="current-price">${formatPrice(product.price)}</span>
                </>
              ) : (
                <span className="current-price">${formatPrice(product.price)}</span>
              )}
            </div>
            
            <div className="product-short-description">
              <p>{product.short_description || product.description?.substring(0, 150) + '...'}</p>
            </div>
            
            {product.in_stock && (
              <div className="product-actions">
                <div className="quantity-selector">
                  <button onClick={decreaseQuantity} className="quantity-btn">-</button>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    max={product.quantity}
                    value={quantity}
                    onChange={handleQuantityChange}
                  />
                  <button onClick={increaseQuantity} className="quantity-btn">+</button>
                </div>
                
                <div className="action-buttons">
                  {!isInCart ? (
                    <button 
                      className="add-to-cart-button"
                      onClick={handleAddToCart}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                      Add to Cart
                    </button>
                  ) : (
                    <button 
                      className="view-cart-button"
                      onClick={() => navigate('/cart')}
                    >
                      View in Cart
                    </button>
                  )}
                  
                  <button 
                    className="buy-now-button"
                    onClick={handleBuyNow}
                  >
                    Buy Now
                  </button>
                  
                  <button className="wishlist-button" aria-label="Add to wishlist">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            <div className="product-meta">
              <div className="meta-item">
                <span className="label">SKU:</span>
                <span className="value">{product.sku}</span>
              </div>
              <div className="meta-item">
                <span className="label">Category:</span>
                <span className="value">
                  <a href={`/shop?category=${product.category_id}`}>{product.category_name}</a>
                </span>
              </div>
              {product.brand && (
                <div className="meta-item">
                  <span className="label">Brand:</span>
                  <span className="value">
                    <a href={`/shop?brand=${product.brand}`}>{product.brand}</a>
                  </span>
                </div>
              )}
              {product.tags && (
                <div className="meta-item">
                  <span className="label">Tags:</span>
                  <span className="value tags">
                    {product.tags.split(',').map((tag, index) => (
                      <a key={index} href={`/shop?tag=${tag.trim()}`} className="tag">
                        {tag.trim()}
                      </a>
                    ))}
                  </span>
                </div>
              )}
            </div>
            
            <div className="product-benefits">
              {product.free_shipping || product.free_shipping_threshold > 0 ? (
                <div className="benefit-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                  <span>
                    {product.free_shipping 
                      ? 'Free shipping' 
                      : `Free shipping on orders over $${product.free_shipping_threshold}`}
                  </span>
                </div>
              ) : null}
              
              {product.money_back_guarantee ? (
                <div className="benefit-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                  <span>{product.money_back_guarantee}-day money-back guarantee</span>
                </div>
              ) : null}
              
              {product.secure_checkout ? (
                <div className="benefit-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>Secure checkout</span>
                </div>
              ) : null}
              
              {product.eco_friendly ? (
                <div className="benefit-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    <line x1="6" y1="1" x2="6" y2="4"></line>
                    <line x1="10" y1="1" x2="10" y2="4"></line>
                    <line x1="14" y1="1" x2="14" y2="4"></line>
                  </svg>
                  <span>{product.eco_friendly_details || 'Eco-friendly packaging'}</span>
                </div>
              ) : null}
            </div>
            
            {product.shipping_time && (
              <div className="shipping-time">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Delivery: {product.shipping_time}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Product Details Tabs */}
        <div className="product-tabs">
          <div className="tabs-header">
            <button 
              className={`tab-button ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button 
              className={`tab-button ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              Features
            </button>
            <button 
              className={`tab-button ${activeTab === 'shipping' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              Shipping & Returns
            </button>
          </div>
          
          <div className="tabs-content">
            <div className={`tab-pane ${activeTab === 'description' ? 'active' : ''}`}>
              <div className="product-description">
                <p>{product.description}</p>
              </div>
            </div>
            
            <div className={`tab-pane ${activeTab === 'features' ? 'active' : ''}`}>
              <div className="product-features">
                <ul>
                  {product.features?.map((feature, index) => (
                    <li key={index}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className={`tab-pane ${activeTab === 'shipping' ? 'active' : ''}`}>
              <div className="shipping-info">
                <h3>Shipping</h3>
                <p>
                  {product.free_shipping 
                    ? 'We offer free shipping on all orders!' 
                    : `We offer free standard shipping on all orders over $${product.free_shipping_threshold}. For orders under $${product.free_shipping_threshold}, standard shipping is $5.99.`}
                </p>
                <p>Standard delivery takes {product.shipping_time || '3-5 business days'}. Expedited shipping options are available at checkout.</p>
                
                <h3>Returns & Exchanges</h3>
                <p>We accept returns within {product.money_back_guarantee || 30} days of purchase. Items must be unused and in original packaging.</p>
                <p>To initiate a return, please contact our customer service team.</p>
                
                {product.warranty_period && (
                  <>
                    <h3>Warranty</h3>
                    <p>This product comes with a {product.warranty_period}-month warranty against manufacturing defects.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews">
          <ReviewTabs productId={productId} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetails; 