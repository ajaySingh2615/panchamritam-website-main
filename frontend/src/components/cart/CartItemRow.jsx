import React from 'react';
import { Link } from 'react-router-dom';
import './CartItemRow.css';

const CartItemRow = ({ item, onQuantityChange, onRemove }) => {
  const { product_id, name, price, quantity, image_url } = item;
  
  // Format price safely, ensuring it's a number
  const formatPrice = (price) => {
    // Convert to number if it's a string, or default to 0 if invalid
    const numericPrice = typeof price === 'string' ? parseFloat(price) : (typeof price === 'number' ? price : 0);
    return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
  };
  
  // Calculate total using the numeric price
  const numericPrice = typeof price === 'string' ? parseFloat(price) : (typeof price === 'number' ? price : 0);
  const total = isNaN(numericPrice) ? 0 : numericPrice * quantity;

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value);
    if (newQuantity > 0) {
      onQuantityChange(product_id, newQuantity);
    }
  };

  return (
    <div className="cart-item">
      <div className="item-product">
        <Link to={`/product/${product_id}`} className="product-link">
          <img 
            src={image_url || '/placeholder-product.jpg'} 
            alt={name} 
            className="product-image"
          />
          <div className="product-info">
            <h3 className="product-name">{name}</h3>
          </div>
        </Link>
      </div>

      <div className="item-price">
        ${formatPrice(price)}
      </div>

      <div className="item-quantity">
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={handleQuantityChange}
          className="quantity-input"
        />
      </div>

      <div className="item-total">
        ${formatPrice(total)}
      </div>

      <div className="item-actions">
        <button 
          className="remove-button"
          onClick={() => onRemove(product_id)}
          aria-label="Remove item"
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
};

export default CartItemRow; 