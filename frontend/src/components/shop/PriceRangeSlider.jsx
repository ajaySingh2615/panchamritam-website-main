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
    <div className="w-full mb-4 text-left pl-0 ml-0">
      <div 
        ref={sliderRef}
        className="relative h-2 bg-gray-200 rounded-full my-5 ml-0 pl-0"
      >
        {/* Active Range Track */}
        <div
          className="absolute h-2 bg-[#9bc948] rounded-full"
          style={{
            left: `${minThumbPosition}%`,
            width: `${maxThumbPosition - minThumbPosition}%`
          }}
        ></div>
        
        {/* Min Thumb */}
        <div
          className={`absolute w-5 h-5 bg-[#9bc948] rounded-full shadow-md -mt-1.5 transform -translate-x-1/2 cursor-pointer flex items-center justify-center`}
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
          className={`absolute w-5 h-5 bg-[#9bc948] rounded-full shadow-md -mt-1.5 transform -translate-x-1/2 cursor-pointer flex items-center justify-center`}
          style={{ left: `${maxThumbPosition}%` }}
          onMouseDown={() => setIsDraggingMax(true)}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={maxPrice}
          aria-valuenow={max}
          tabIndex={0}
        ></div>
      </div>
      
      <div className="flex gap-3 ml-0 pl-0">
        <div className="ml-0 pl-0 pr-2">
          <div className="border border-gray-300 rounded py-2 px-2 text-left bg-white">
            £{min}
          </div>
        </div>
        <div className="pl-0">
          <div className="border border-gray-300 rounded py-2 px-2 text-left bg-white">
            £{max}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceRangeSlider; 