import React from 'react';

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange, totalProducts }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Categories</h2>
      <ul className="space-y-3">
        <li>
          <button 
            onClick={() => onCategoryChange(null)}
            className={`flex justify-between w-full text-left py-2 px-3 rounded ${!selectedCategory ? 'bg-indigo-100 text-indigo-800' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <span>All Products</span>
            <span className="bg-gray-200 text-gray-700 px-2 rounded-full text-sm">
              {totalProducts}
            </span>
          </button>
        </li>
        {categories.map(category => (
          <li key={category.category_id}>
            <button 
              onClick={() => onCategoryChange(category.category_id)}
              className={`flex justify-between w-full text-left py-2 px-3 rounded ${selectedCategory == category.category_id ? 'bg-indigo-100 text-indigo-800' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <span>{category.name}</span>
              <span className="bg-gray-200 text-gray-700 px-2 rounded-full text-sm">
                {category.product_count || 0}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryFilter; 