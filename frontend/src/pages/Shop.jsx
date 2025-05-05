import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { API_ENDPOINTS } from '../config/api';
import PriceRangeSlider from '../components/shop/PriceRangeSlider';
import CategoryFilter from '../components/shop/CategoryFilter';
import ProductCard from '../components/shop/ProductCard';
import Breadcrumb from '../components/common/Breadcrumb';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortOption, setSortOption] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const productsPerPage = 9;
  
  // Parse URL search params
  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('category');
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const pageParam = searchParams.get('page');
  
  useEffect(() => {
    // Set initial values from URL params
    if (minPriceParam && maxPriceParam) {
      setPriceRange([
        parseInt(minPriceParam || 0, 10),
        parseInt(maxPriceParam || 1000, 10)
      ]);
    }
    
    if (pageParam) {
      setCurrentPage(parseInt(pageParam, 10));
    }
    
    // Fetch categories
    fetchCategories();
    
    // Fetch products
    fetchProducts();
  }, [location.search]);
  
  const fetchCategories = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CATEGORIES);
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      if (data.data && data.data.categories) {
        setCategories(data.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams(location.search);
      
      if (!params.has('page')) {
        params.set('page', currentPage.toString());
      }
      
      params.set('limit', productsPerPage.toString());
      
      const requestUrl = `${API_ENDPOINTS.PRODUCTS}?${params.toString()}`;
      const response = await fetch(requestUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      if (data.data) {
        setProducts(data.data.products || []);
        setTotalPages(data.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCategoryFilter = (categoryId) => {
    const params = new URLSearchParams(location.search);
    
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    
    params.set('page', '1');
    navigate(`${location.pathname}?${params.toString()}`);
  };
  
  const handlePriceFilter = () => {
    const params = new URLSearchParams(location.search);
    
    params.set('minPrice', priceRange[0].toString());
    params.set('maxPrice', priceRange[1].toString());
    params.set('page', '1');
    
    navigate(`${location.pathname}?${params.toString()}`);
  };
  
  const handlePageChange = (page) => {
    const params = new URLSearchParams(location.search);
    params.set('page', page.toString());
    navigate(`${location.pathname}?${params.toString()}`);
    setCurrentPage(page);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleAddToCart = (product) => {
    addToCart({
      ...product,
      quantity: 1
    });
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const formatPrice = (price) => {
    return price.toFixed(2);
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
  
  const handlePriceChange = (range) => {
    setPriceRange(range);
  };
  
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header - Remove breadcrumb and heading from here */}
        <div className="pt-4 mb-8">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {products.length} products found
            </p>
            <button 
              onClick={toggleFilters}
              className="lg:hidden bg-[#9bc948] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#8ab938] transition duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
              </svg>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className={`w-full lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Filter by price</h2>
              
              <PriceRangeSlider 
                minPrice={0}
                maxPrice={1000}
                initialMin={priceRange[0]}
                initialMax={priceRange[1]}
                onPriceChange={handlePriceChange}
              />
              
              <button 
                onClick={handlePriceFilter}
                className="w-full bg-[#9bc948] text-white py-2 rounded-md hover:bg-[#8ab938] transition duration-300"
              >
                Filter
              </button>
            </div>
            
            <CategoryFilter
              categories={categories}
              selectedCategory={categoryParam}
              onCategoryChange={handleCategoryFilter}
              totalProducts={products.length}
            />
          </div>
          
          {/* Products Grid */}
          <div className="w-full lg:w-3/4">
            {/* Move breadcrumb and Shop heading here */}
            {/* Breadcrumb at the top */}
            {categoryParam && categories.find(c => c.category_id == categoryParam) ? (
              <Breadcrumb
                items={[
                  { label: 'Home', path: '/' },
                  { label: categories.find(c => c.category_id == categoryParam).name, path: `/shop?category=${categoryParam}` }
                ]}
              />
            ) : (
              <Breadcrumb
                items={[
                  { label: 'Home', path: '/' },
                  { label: 'Shop', path: '/shop' }
                ]}
              />
            )}
            
            {/* Shop heading with adjusted spacing */}
            <h1 className="text-6xl font-bold text-[#9bc948] mt-2 mb-6">
              {categoryParam && categories.find(c => c.category_id == categoryParam)
                ? categories.find(c => c.category_id == categoryParam).name
                : 'Shop'
              }
            </h1>
            
            {/* Sorting Options */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded shadow-sm">
              <div className="text-gray-600 mb-3 md:mb-0">
                Showing {(currentPage - 1) * productsPerPage + 1}–{Math.min(currentPage * productsPerPage, products.length)} of {products.length} results
              </div>
              <div className="relative">
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="px-4 py-2 pr-8 border border-gray-300 rounded-md bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#9bc948]"
                >
                  <option value="default">Default sorting</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 p-4 rounded-md text-red-700 mb-6">
                {error}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search criteria.</p>
                <button 
                  onClick={() => navigate('/shop')}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard 
                    key={product.product_id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === 1 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-md ${
                        currentPage === page
                          ? 'bg-[#9bc948] text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === totalPages 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop; 