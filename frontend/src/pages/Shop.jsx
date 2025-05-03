import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/shop/ProductCard';
import CategoryFilter from '../components/shop/CategoryFilter';
import PriceSlider from '../components/shop/PriceSlider';
import Breadcrumb from '../components/layout/Breadcrumb';
import { API_ENDPOINTS } from '../config/api';
import './Shop.css';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Default to showing filters on desktop, hiding on mobile
  const getInitialFilterState = () => {
    try {
      const saved = sessionStorage.getItem('showFilters');
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error parsing saved filter state:", e);
    }
    return window.innerWidth > 768;
  };
  
  const [showFilters, setShowFilters] = useState(getInitialFilterState);
  const [forceRender, setForceRender] = useState(0); // Used to force re-renders
  
  const productsPerPage = 9;
  
  const location = useLocation();
  const navigate = useNavigate();

  // Save filter state whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem('showFilters', JSON.stringify(showFilters));
    } catch (e) {
      console.error("Error saving filter state:", e);
    }
  }, [showFilters]);

  // Handle window resize to show/hide filters based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowFilters(true);
      }
    };
    
    // Run once on mount
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Force a re-render on page load to ensure sidebar visibility state is applied
  useEffect(() => {
    // Short timeout to ensure the component is fully mounted
    const timer = setTimeout(() => {
      setForceRender(prev => prev + 1);
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);

  // Parse URL search params
  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('category');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const sortParam = searchParams.get('sort');
  
  // Set initial page from URL if available
  useEffect(() => {
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) {
        setCurrentPage(page);
      }
    }
    
    if (sortParam) {
      setSortOption(sortParam);
    }
  }, [pageParam, sortParam]);
  
  const categoryName = categoryParam 
    ? categories.find(cat => cat.category_id.toString() === categoryParam)?.name 
    : '';

  // Breadcrumb items - make sure this is visible
  const breadcrumbItems = categoryParam 
    ? [
        { label: 'Home', path: '/' },
        { label: 'Shop', path: '/shop' },
        { label: categoryName || 'Category', path: `/shop?category=${categoryParam}` }
      ]
    : [
        { label: 'Home', path: '/' },
        { label: 'Shop', path: '/shop' }
      ];

  // Toggle filters visibility on mobile
  const toggleFilters = useCallback(() => {
    setShowFilters(prevState => {
      const newState = !prevState;
      try {
        sessionStorage.setItem('showFilters', JSON.stringify(newState));
      } catch (e) {
        console.error("Error saving filter state:", e);
      }
      return newState;
    });
  }, []);

  // Build URL params for fetching products
  const buildUrlParams = useCallback(() => {
    const params = new URLSearchParams(location.search);
    
    // Add pagination parameters
    params.set('page', currentPage.toString());
    params.set('limit', productsPerPage.toString());
    
    // Add sorting if not default
    if (sortOption !== 'default') {
      params.set('sort', sortOption);
    } else {
      params.delete('sort');
    }
    
    // Add search term if present
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    } else {
      params.delete('search');
    }
    
    return params.toString();
  }, [location.search, currentPage, productsPerPage, sortOption, searchTerm]);

  // Fetch products with pagination
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const urlParams = buildUrlParams();
        const requestUrl = `${API_ENDPOINTS.PRODUCTS}?${urlParams}`;
        
        const response = await fetch(requestUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Received non-JSON response from server');
        }

        const data = await response.json();
        
        if (data.data) {
          // Process the response data
          const processedProducts = data.data.products?.map(product => ({
            ...product,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price
          })) || [];
          
          setProducts(processedProducts);
          
          // Update pagination information
          setTotalProducts(data.data.total || processedProducts.length);
          setTotalPages(data.data.totalPages || Math.ceil(processedProducts.length / productsPerPage));
        } else {
          console.warn('Unexpected API response structure:', data);
          setProducts([]);
          setTotalProducts(0);
          setTotalPages(1);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products. Please try again later.');
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [buildUrlParams]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.CATEGORIES);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Received non-JSON response from server');
        }

        const data = await response.json();
        
        if (data.data && data.data.categories) {
          setCategories(data.data.categories);
        } else {
          console.warn('Unexpected API response structure:', data);
          setCategories([]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle sort change
  const handleSortChange = (e) => {
    const newSortOption = e.target.value;
    setSortOption(newSortOption);
    setCurrentPage(1); // Reset to first page when sorting changes
    
    // Update URL with sort parameter
    const params = new URLSearchParams(location.search);
    if (newSortOption !== 'default') {
      params.set('sort', newSortOption);
    } else {
      params.delete('sort');
    }
    
    // Update URL without refreshing the page
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    
    // Update URL with page parameter
    const params = new URLSearchParams(location.search);
    params.set('page', pageNumber.toString());
    
    // Update URL without refreshing the page
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    
    // Scroll to top of products
    document.querySelector('.shop-main').scrollIntoView({ behavior: 'smooth' });
  };

  if (loading && products.length === 0) {
    return (
      <div className="shop-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="shop-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
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

  // Calculate the range of products being shown
  const firstProductShown = products.length ? (currentPage - 1) * productsPerPage + 1 : 0;
  const lastProductShown = Math.min(currentPage * productsPerPage, totalProducts);

  // Generate pagination numbers with ellipsis for large page counts
  const renderPaginationNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Maximum number of page buttons to show
    
    if (totalPages <= maxPagesToShow) {
      // If total pages is less than or equal to max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Calculate start and end of the middle section
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // If current page is near the start
      if (currentPage <= 3) {
        endPage = 4;
      }
      
      // If current page is near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  return (
    <div className="shop-page" key={`shop-page-${forceRender}`}>
      <div className="shop-container">
        {/* Mobile Filter Toggle */}
        <button className="filter-toggle" onClick={toggleFilters}>
          {showFilters ? 'Hide Filters' : 'Show Filters'} 
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M6 12h12"></path>
            <path d="M9 18h6"></path>
          </svg>
        </button>

        {/* Left Sidebar with Filters */}
        <aside className={`shop-sidebar ${showFilters ? 'visible' : 'hidden'}`}>
          <div className="search-filter">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              <button className="search-button" aria-label="Search">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <PriceSlider minPrice={0} maxPrice={1000} />
          <CategoryFilter categories={categories} />
        </aside>

        {/* Main Content Area */}
        <main className="shop-main">
          {/* Breadcrumb with forced visibility */}
          <div className="breadcrumb-container" style={{display: 'block', visibility: 'visible', width: '100%'}}>
            <Breadcrumb items={breadcrumbItems} />
          </div>
          
          {/* Category Title */}
          <div className="category-heading">
            <h1 className="category-title">
              {categoryParam 
                ? categoryName || 'Category' 
                : 'Shop'
              }
            </h1>
          </div>
          
          {/* Shop Header with Results Count and Sorting */}
          <div className="shop-header">
            <p className="product-count">
              {totalProducts > 0 
                ? `Showing ${firstProductShown}–${lastProductShown} of ${totalProducts} results` 
                : 'No products found'
              }
            </p>
            
            <div className="shop-sort">
              <select 
                className="sort-select" 
                value={sortOption}
                onChange={handleSortChange}
              >
                <option value="default">Default sorting</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>

          {/* Products Grid Container */}
          <div className="products-section">
            {loading && (
              <div className="loading-overlay">
                <div className="spinner"></div>
              </div>
            )}
            
            {products.length === 0 && !loading ? (
              <div className="no-products">
                <p>No products found matching your criteria.</p>
              </div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
              </div>
            )}
          </div>
          
          {/* Enhanced Pagination with Ellipsis */}
          {totalPages > 1 && (
            <div className="pagination">
              {/* Previous Button */}
              <button
                className={`pagination-button prev ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                <span>Prev</span>
              </button>
              
              {/* Page Numbers with Ellipsis */}
              <div className="pagination-numbers">
                {renderPaginationNumbers().map((page, index) => (
                  typeof page === 'number' ? (
                    <button
                      key={index}
                      className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                      aria-label={`Page ${page}`}
                      aria-current={currentPage === page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={index} className="pagination-ellipsis">...</span>
                  )
                ))}
              </div>
              
              {/* Next Button */}
              <button
                className={`pagination-button next ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <span>Next</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop; 