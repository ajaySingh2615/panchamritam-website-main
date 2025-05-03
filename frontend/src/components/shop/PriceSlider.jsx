import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PriceSlider.css';

const PriceSlider = ({ minPrice = 0, maxPrice = 1000 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Initialize state from URL or defaults
  const [minValue, setMinValue] = useState(
    parseInt(searchParams.get('minPrice')) || minPrice
  );
  const [maxValue, setMaxValue] = useState(
    parseInt(searchParams.get('maxPrice')) || maxPrice
  );
  
  // Text input states (separate from slider values)
  const [minInputValue, setMinInputValue] = useState(minValue.toString());
  const [maxInputValue, setMaxInputValue] = useState(maxValue.toString());

  // Debounce function to delay URL updates
  const debounce = (func, delay) => {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Update URL with debounce (500ms delay)
  const updateURL = useCallback(
    debounce((min, max) => {
      const newSearchParams = new URLSearchParams(location.search);
      
      if (min > minPrice) {
        newSearchParams.set('minPrice', min);
      } else {
        newSearchParams.delete('minPrice');
      }
  
      if (max < maxPrice) {
        newSearchParams.set('maxPrice', max);
      } else {
        newSearchParams.delete('maxPrice');
      }
  
      navigate({
        pathname: location.pathname,
        search: newSearchParams.toString()
      }, { replace: true }); // Use replace to avoid adding to history stack
    }, 500),
    [navigate, location.pathname, location.search, minPrice, maxPrice]
  );

  // Update URL when slider values change
  useEffect(() => {
    updateURL(minValue, maxValue);
  }, [minValue, maxValue, updateURL]);

  // Handle min slider change
  const handleMinSliderChange = (e) => {
    const newMinValue = parseInt(e.target.value);
    if (newMinValue <= maxValue) {
      setMinValue(newMinValue);
      setMinInputValue(newMinValue.toString());
    }
  };

  // Handle max slider change
  const handleMaxSliderChange = (e) => {
    const newMaxValue = parseInt(e.target.value);
    if (newMaxValue >= minValue) {
      setMaxValue(newMaxValue);
      setMaxInputValue(newMaxValue.toString());
    }
  };

  // Handle min input change
  const handleMinInputChange = (e) => {
    const inputVal = e.target.value;
    setMinInputValue(inputVal);
    
    // Only update slider if valid number
    const newMinValue = parseInt(inputVal);
    if (!isNaN(newMinValue) && newMinValue <= maxValue) {
      setMinValue(newMinValue);
    }
  };

  // Handle max input change
  const handleMaxInputChange = (e) => {
    const inputVal = e.target.value;
    setMaxInputValue(inputVal);
    
    // Only update slider if valid number
    const newMaxValue = parseInt(inputVal);
    if (!isNaN(newMaxValue) && newMaxValue >= minValue) {
      setMaxValue(newMaxValue);
    }
  };

  // Validate input on blur
  const handleMinInputBlur = () => {
    const newMinValue = parseInt(minInputValue);
    if (isNaN(newMinValue) || newMinValue < minPrice) {
      setMinValue(minPrice);
      setMinInputValue(minPrice.toString());
    } else if (newMinValue > maxValue) {
      setMinValue(maxValue);
      setMinInputValue(maxValue.toString());
    } else {
      setMinValue(newMinValue);
      setMinInputValue(newMinValue.toString());
    }
  };

  // Validate input on blur
  const handleMaxInputBlur = () => {
    const newMaxValue = parseInt(maxInputValue);
    if (isNaN(newMaxValue) || newMaxValue > maxPrice) {
      setMaxValue(maxPrice);
      setMaxInputValue(maxPrice.toString());
    } else if (newMaxValue < minValue) {
      setMaxValue(minValue);
      setMaxInputValue(minValue.toString());
    } else {
      setMaxValue(newMaxValue);
      setMaxInputValue(newMaxValue.toString());
    }
  };

  return (
    <div className="price-slider">
      <h3>Filter by price</h3>
      
      {/* Min slider */}
      <div className="single-slider-container">
        <span className="slider-label">Min: {minValue}</span>
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          value={minValue}
          onChange={handleMinSliderChange}
          className="single-slider"
        />
      </div>
      
      {/* Max slider */}
      <div className="single-slider-container">
        <span className="slider-label">Max: {maxValue}</span>
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          value={maxValue}
          onChange={handleMaxSliderChange}
          className="single-slider"
        />
      </div>

      {/* Price input fields */}
      <div className="price-inputs">
        <div className="price-input">
          <input
            type="text"
            value={minInputValue}
            onChange={handleMinInputChange}
            onBlur={handleMinInputBlur}
            placeholder="Min"
            aria-label="Minimum price"
          />
        </div>
        <span className="price-separator">to</span>
        <div className="price-input">
          <input
            type="text"
            value={maxInputValue}
            onChange={handleMaxInputChange}
            onBlur={handleMaxInputBlur}
            placeholder="Max"
            aria-label="Maximum price"
          />
        </div>
      </div>
    </div>
  );
};

export default PriceSlider; 