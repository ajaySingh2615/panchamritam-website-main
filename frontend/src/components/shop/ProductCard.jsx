import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  // Make sure we have a valid product object
  if (!product || typeof product !== 'object') {
    console.error('Invalid product data:', product);
    return null;
  }

  const { addToCart, updateCartItemQuantity, removeFromCart, cart } = useCart();
  const [inCart, setInCart] = useState(false);
  const [quantity, setQuantity] = useState(0);
  
  const {
    product_id,
    name,
    price,
    image_url,
    category_name,
    quantity: stockQuantity
  } = product;

  // Check if item is in cart on mount and when cart changes
  useEffect(() => {
    const cartItem = cart.find(item => item.product_id === product_id);
    if (cartItem) {
      setInCart(true);
      setQuantity(cartItem.quantity);
    } else {
      setInCart(false);
      setQuantity(0);
    }
  }, [cart, product_id]);

  // Safety check for required fields
  if (!product_id) {
    console.error('Product missing ID:', product);
    return null;
  }

  // Format price safely, ensuring it's a number
  const formatPrice = (price) => {
    // Convert to number if it's a string, or default to 0 if invalid
    const numericPrice = typeof price === 'string' ? parseFloat(price) : (typeof price === 'number' ? price : 0);
    return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
  };

  const displayCategory = category_name || "Groceries"; // Default to Groceries if no category
  const isOutOfStock = stockQuantity === 0 || stockQuantity === undefined;
  const isOnSale = price && price < 50; // Just an example condition for sale items

  // Handle add to cart
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      // Make a copy of the product with initial quantity of 1
      const productToAdd = {
        ...product,
        quantity: 1
      };
      addToCart(productToAdd);
    }
  };

  // Increase quantity
  const increaseQuantity = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (stockQuantity > quantity) {
      updateCartItemQuantity(product_id, quantity + 1);
    }
  };

  // Decrease quantity
  const decreaseQuantity = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 1) {
      updateCartItemQuantity(product_id, quantity - 1);
    } else {
      // When quantity reaches 0, remove from cart
      // This will trigger the useEffect to set inCart to false
      removeFromCart(product_id);
      setInCart(false);
      setQuantity(0);
    }
  };

  return (
    <li className="product-card">
      <div className="product-thumbnail-wrap">
        {isOnSale && <span className="onsale">Sale</span>}
        {isOutOfStock && <span className="out-of-stock">Out of Stock</span>}
        
        <Link to={`/product/${product_id}`} className="product-link">
          <img 
            src={image_url || '/placeholder-product.jpg'} 
            alt={name || 'Product'} 
            className="product-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-product.jpg';
            }}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Link>
      </div>
      
      <div className="product-summary-wrap">
        <span className="product-category">
          {displayCategory}
        </span>
        
        <Link to={`/product/${product_id}`} className="product-title-link">
          <h2 className="product-title">{name || 'Unnamed Product'}</h2>
        </Link>
        
        <span className="product-price">
          <span className="price-amount">£{formatPrice(price)}</span>
        </span>
        
        {!inCart ? (
          <button 
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="add-to-cart-button"
          >
            Add to cart
          </button>
        ) : (
          <div className="quantity-control">
            <button onClick={decreaseQuantity} className="quantity-btn">-</button>
            <span className="quantity">{quantity}</span>
            <button onClick={increaseQuantity} className="quantity-btn">+</button>
          </div>
        )}
      </div>
    </li>
  );
};

export default ProductCard; 