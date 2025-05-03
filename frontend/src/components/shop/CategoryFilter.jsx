import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CategoryFilter.css';

const CategoryFilter = ({ categories }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get('category');

  const handleCategoryClick = (categoryId) => {
    const newSearchParams = new URLSearchParams(location.search);
    
    if (categoryId === currentCategory) {
      newSearchParams.delete('category');
    } else {
      newSearchParams.set('category', categoryId);
    }

    navigate({
      pathname: location.pathname,
      search: newSearchParams.toString()
    });
  };

  return (
    <div className="category-filter">
      <ul className="category-list">
        {categories.map((category) => (
          <li
            key={category.category_id}
            className={`category-item ${currentCategory === category.category_id.toString() ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category.category_id.toString())}
          >
            <div className="category-name-with-count">
              {category.name}<span className="category-count">({category.product_count || 0})</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryFilter; 