import React from 'react';

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange, totalProducts }) => {
  return (
    <div className="bg-[#f8f6f3] rounded pl-0 pr-5 pt-5 pb-5 text-left">
      <ul className="space-y-2 pl-0 ml-0">
        <li className="pl-0 ml-0">
          <button 
            onClick={() => onCategoryChange(null)}
            className={`w-full text-left py-2 px-3 rounded ${!selectedCategory ? 'bg-[#9bc948] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            {!selectedCategory ? (
              <>All Products ({totalProducts})</>
            ) : (
              <>
                <span className="text-[#9bc948]">All Products</span>
                <span className="text-gray-800"> ({totalProducts})</span>
              </>
            )}
          </button>
        </li>
        {categories.map(category => (
          <li key={category.category_id} className="pl-0 ml-0">
            <button 
              onClick={() => onCategoryChange(category.category_id)}
              className={`w-full text-left py-2 px-3 rounded ${selectedCategory == category.category_id ? 'bg-[#9bc948] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {selectedCategory == category.category_id ? (
                <>{category.name} ({category.product_count || 0})</>
              ) : (
                <>
                  <span className="text-[#9bc948]">{category.name}</span>
                  <span className="text-gray-800"> ({category.product_count || 0})</span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryFilter; 