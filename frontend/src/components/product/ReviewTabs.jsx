import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../shop/ProductCard';
import { API_ENDPOINTS, API_URL } from '../../config/api';
import { checkBackendConnection, testApiCall } from '../../utils/apiUtils';
import './ReviewTabs.css';

// Star Rating component for better interactivity
const StarRating = ({ rating, setRating }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  return (
    <div className="rating-selector">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hoverRating || rating) ? 'selected' : ''}`}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const ReviewTabs = ({ productId }) => {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('reviews');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    average_rating: 0,
    total_reviews: 0,
    five_star: 0,
    four_star: 0,
    three_star: 0,
    two_star: 0,
    one_star: 0
  });
  
  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Check if user is authenticated
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setIsLoggedIn(!!storedToken || !!token);
    
    console.log('Auth status:', { 
      hasToken: !!storedToken, 
      contextToken: !!token, 
      user: !!user 
    });
  }, [token, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch reviews
      try {
        const reviewsResponse = await fetch(`${API_ENDPOINTS.REVIEWS}/product/${productId}`);
        
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          console.log('API returned reviews:', reviewsData.data.reviews);
          
          if (reviewsData.data && reviewsData.data.reviews) {
            setReviews(reviewsData.data.reviews);
          }
          
          if (reviewsData.data && reviewsData.data.stats) {
            setReviewStats(reviewsData.data.stats);
          }
        }
      } catch (reviewsError) {
        console.warn('Could not fetch reviews:', reviewsError);
      }
      
      // Fetch related products
      try {
        const relatedResponse = await fetch(`${API_ENDPOINTS.PRODUCTS}/${productId}/related`);
        
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          
          // Handle different possible structures for related products
          let relatedProductsData = [];
          
          if (relatedData.data) {
            if (relatedData.data.products && Array.isArray(relatedData.data.products)) {
              relatedProductsData = relatedData.data.products;
            } else if (Array.isArray(relatedData.data)) {
              relatedProductsData = relatedData.data;
            }
          }
          
          setRelatedProducts(relatedProductsData);
        }
      } catch (relatedError) {
        console.warn('Could not fetch related products:', relatedError);
      }
    } catch (err) {
      console.error('Error fetching product data:', err);
      setError('Could not load product information. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchData();
    } else {
      setLoading(false);
      setError('No product ID available');
    }
  }, [productId]);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle form submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setFormError('Please log in to submit a review');
      return;
    }
    
    if (rating < 1 || rating > 5) {
      setFormError('Rating must be between 1 and 5');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setFormError(null);
      setSuccess(null);
      
      const storedToken = localStorage.getItem('token');
      const apiUrl = `${API_URL}/reviews/product/${productId}`;
      console.log('Submitting review to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        },
        body: JSON.stringify({
          rating,
          title: title || 'Review',
          content
        })
      });
      
      const responseData = await response.json();
      console.log('Review submission response:', responseData);
      
      if (response.ok) {
        setSuccess('Your review has been submitted successfully!');
        
        // Create a new review object and add it to the list immediately
        const now = new Date().toISOString();
        const newReview = {
          review_id: `temp-${Date.now()}`,
          product_id: parseInt(productId),
          user_id: user?.user_id,
          user_name: user?.name || 'You',
          user_profile_picture: user?.profile_picture || '/default-avatar.png',
          rating,
          title: title || 'Review',
          content,
          created_at: now,
          updated_at: now
        };
        
        console.log('Adding new review to state:', newReview);
        
        // Directly update the reviews state with the new review
        setReviews(prevReviews => {
          const updatedReviews = [newReview, ...(prevReviews || [])];
          console.log('Updated reviews list:', updatedReviews);
          return updatedReviews;
        });
        
        // Reset form
        setRating(5);
        setTitle('');
        setContent('');
        
        // Switch to reviews tab
        setActiveTab('reviews');
        
        // Refresh the data from server
        fetchData();
      } else {
        throw new Error(responseData.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      setFormError(error.message || 'An error occurred while submitting your review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading additional product information...</p>
      </div>
    );
  }

  return (
    <div className="product-sections">
      {error && (
        <div className="error-message info-message">
          <p>{error}</p>
        </div>
      )}
      
      <div className="tab-buttons">
        <button 
          className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({reviews.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'write' ? 'active' : ''}`}
          onClick={() => setActiveTab('write')}
        >
          Write a Review
        </button>
        <button 
          className={`tab-button ${activeTab === 'related' ? 'active' : ''}`}
          onClick={() => setActiveTab('related')}
        >
          Related Products
        </button>
      </div>
      
      <div className="tab-content">
        {/* Reviews Tab */}
        <div className={`tab-pane ${activeTab === 'reviews' ? 'active' : ''}`}>
          {console.log('Rendering reviews tab, reviews:', reviews)}
          
          {reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
          ) : (
            <>
              {/* Review stats section */}
              <div className="review-stats">
                <div className="average-rating">
                  <span className="big-rating">{parseFloat(reviewStats.average_rating || 0).toFixed(1)}</span>
                  <div className="stars-summary">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star ${star <= Math.round(reviewStats.average_rating || 0) ? 'filled' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="review-count">({reviewStats.total_reviews || 0} reviews)</span>
                  </div>
                </div>
                
                <div className="rating-bars">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviewStats[`${stars}_star`] || 0;
                    const percentage = reviewStats.total_reviews > 0 
                      ? (count / reviewStats.total_reviews) * 100 
                      : 0;
                    
                    return (
                      <div key={stars} className="rating-bar-row">
                        <div className="stars-label">{stars} stars</div>
                        <div className="rating-bar-container">
                          <div 
                            className="rating-bar-fill"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="rating-count">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Reviews list */}
              <div className="reviews-list">
                {reviews.map((review, index) => {
                  console.log(`Rendering review ${index}:`, review);
                  return (
                    <div key={review.review_id || index} className="review-card">
                      <div className="review-header">
                        <div className="reviewer-info">
                          <img 
                            src={review.user_profile_picture || '/default-avatar.png'} 
                            alt={review.user_name || 'Reviewer'}
                            className="reviewer-avatar"
                          />
                          <div>
                            <h4>{review.user_name || 'Anonymous'}</h4>
                            <div className="review-rating">
                              {[...Array(5)].map((_, index) => (
                                <span
                                  key={index}
                                  className={`star ${index < review.rating ? 'filled' : ''}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="review-date">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      
                      {review.title && <h3 className="review-title">{review.title}</h3>}
                      <p className="review-content">{review.content}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        
        {/* Write Review Tab */}
        <div className={`tab-pane ${activeTab === 'write' ? 'active' : ''}`}>
          <div className="review-form-container">
            {!isLoggedIn ? (
              <div className="login-prompt">
                <p>Please <Link to="/login">login</Link> to leave a review</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="review-form">
                <h3>Write a Review</h3>
                
                {formError && <div className="error-message">{formError}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <div className="form-group">
                  <label>Rating</label>
                  <StarRating rating={rating} setRating={setRating} />
                  <div className="rating-text">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="review-title">Review Title</label>
                  <input
                    type="text"
                    id="review-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summarize your experience (optional)"
                    maxLength="100"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="review-content">Your Review</label>
                  <textarea
                    id="review-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What did you like or dislike about this product?"
                    rows="4"
                    maxLength="1000"
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="submit-review-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
        
        {/* Related Products Tab */}
        <div className={`tab-pane ${activeTab === 'related' ? 'active' : ''}`}>
          {relatedProducts.length === 0 ? (
            <p className="no-related">No related products found.</p>
          ) : (
            <div className="related-products-grid">
              {relatedProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewTabs; 