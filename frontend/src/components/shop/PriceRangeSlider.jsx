import React, { useState, useEffect, useRef } from 'react';

const PriceRangeSlider = ({ minPrice = 0, maxPrice = 1000, initialMin = 15, initialMax = 35, onPriceChange }) => {
  const [min, setMin] = useState(initialMin);
  const [max, setMax] = useState(initialMax);
  const [isDraggingMin, setIsDraggingMin] = useState(false);
  const [isDraggingMax, setIsDraggingMax] = useState(false);
  const sliderRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingMin && !isDraggingMax) return;
      if (!sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const sliderWidth = rect.width;
      const offsetX = e.clientX - rect.left;
      
      // Calculate percentage of slider width
      const percentage = Math.max(0, Math.min(100, (offsetX / sliderWidth) * 100));
      
      // Calculate value based on min and max price
      const value = Math.round(((percentage / 100) * (maxPrice - minPrice)) + minPrice);
      
      if (isDraggingMin) {
        // Ensure min doesn't exceed max
        setMin(Math.min(value, max - 1));
      } else if (isDraggingMax) {
        // Ensure max doesn't fall below min
        setMax(Math.max(value, min + 1));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingMin || isDraggingMax) {
        // Only call the callback when we stop dragging
        if (onPriceChange) {
          onPriceChange([min, max]);
        }
      }
      
      setIsDraggingMin(false);
      setIsDraggingMax(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingMin, isDraggingMax, min, max, minPrice, maxPrice, onPriceChange]);

  // Calculate thumb positions as percentages
  const minThumbPosition = ((min - minPrice) / (maxPrice - minPrice)) * 100;
  const maxThumbPosition = ((max - minPrice) / (maxPrice - minPrice)) * 100;

  return (
    <div className="w-full mb-6">
      <div 
        ref={sliderRef}
        className="relative h-2 bg-indigo-200 rounded-full mt-6 mb-8"
      >
        {/* Active Range Track */}
        <div
          className="absolute h-2 bg-indigo-600 rounded-full"
          style={{
            left: `${minThumbPosition}%`,
            width: `${maxThumbPosition - minThumbPosition}%`
          }}
        ></div>
        
        {/* Min Thumb */}
        <div
          className={`absolute w-5 h-5 bg-white rounded-full shadow-md -mt-1.5 transform -translate-x-1/2 cursor-pointer flex items-center justify-center border-2 ${isDraggingMin ? 'border-indigo-600 z-20' : 'border-indigo-400 z-10'}`}
          style={{ left: `${minThumbPosition}%` }}
          onMouseDown={() => setIsDraggingMin(true)}
          role="slider"
          aria-valuemin={minPrice}
          aria-valuemax={max}
          aria-valuenow={min}
          tabIndex={0}
        ></div>
        
        {/* Max Thumb */}
        <div
          className={`absolute w-5 h-5 bg-white rounded-full shadow-md -mt-1.5 transform -translate-x-1/2 cursor-pointer flex items-center justify-center border-2 ${isDraggingMax ? 'border-indigo-600 z-20' : 'border-indigo-400 z-10'}`}
          style={{ left: `${maxThumbPosition}%` }}
          onMouseDown={() => setIsDraggingMax(true)}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={maxPrice}
          aria-valuenow={max}
          tabIndex={0}
        ></div>
      </div>
      
      <div className="flex justify-between">
        <div className="w-1/2 pr-2">
          <input 
            type="text" 
            value={`£${min}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 text-center"
            readOnly
          />
        </div>
        <div className="w-1/2 pl-2">
          <input 
            type="text" 
            value={`£${max}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 text-center"
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default PriceRangeSlider; 