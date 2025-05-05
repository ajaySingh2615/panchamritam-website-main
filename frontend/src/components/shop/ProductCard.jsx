import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, onAddToCart }) => {
  const formatPrice = (price) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : (typeof price === 'number' ? price : 0);
    return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
  };

  // Generate star ratings
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fillOpacity="0.5"></path>
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
          </svg>
        );
      }
    }
    
    return stars;
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const isOnSale = product.regular_price && parseFloat(product.regular_price) > parseFloat(product.price);

  return (
    <div className="product-card bg-[#f8f6f3] rounded-lg shadow-md overflow-hidden group relative">
      {/* Sale badge */}
      {isOnSale && <div className="sale-badge">Sale!</div>}
      
      <Link to={`/product/${product.product_id}`} className="block">
        <div className="product-image-container">
          <img 
            src={product.image_url || '/placeholder-product.jpg'} 
            alt={product.name} 
            className="product-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-product.jpg';
            }}
          />
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/product/${product.product_id}`} className="block">
          <div className="text-gray-500 text-sm mb-1">
            {product.category_name || 'Uncategorized'}
          </div>
          
          <h3 className="product-title text-gray-800 font-bold text-lg mb-2 group-hover:text-[#9bc948] transition duration-300">
            {product.name}
          </h3>
          
          <div className="flex items-center mb-3">
            {renderStarRating(product.rating || 0)}
          </div>
        </Link>
        
        <div className="flex justify-between items-center">
          <div>
            {isOnSale ? (
              <div className="flex items-center">
                <span className="text-gray-400 line-through text-sm mr-2">
                  £{formatPrice(product.regular_price)}
                </span>
                <span className="text-[#9bc948] font-bold text-lg">
                  £{formatPrice(product.price)}
                </span>
              </div>
            ) : (
              <span className="text-[#9bc948] font-bold text-lg">
                £{formatPrice(product.price)}
              </span>
            )}
          </div>
          
          <button 
            onClick={handleAddToCart}
            className="bg-[#9bc948] text-white p-2 rounded-full hover:bg-[#8ab938] transition duration-300 focus:outline-none focus:ring-2 focus:ring-[#9bc948] focus:ring-opacity-50"
            aria-label="Add to cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 