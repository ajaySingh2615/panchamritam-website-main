import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProduct, getAllCategories, uploadProductImage } from '../../services/adminAPI';

const ProductCreate = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: '',
    regular_price: '',
    quantity: '0',
    categoryId: '',
    brand: 'GreenMagic',
    sku: '',
    image_url: '',
    free_shipping: false,
    shipping_time: '3-5 business days',
    warranty_period: '',
    eco_friendly: true,
    eco_friendly_details: 'Eco-friendly packaging',
    tags: '',
    is_featured: false,
    status: 'active'
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getAllCategories();
        setCategories(response.data.categories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again.');
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Simple validation for image type
      if (!file.type.match('image.*')) {
        setError('Please select an image file (png, jpg, jpeg)');
        return;
      }
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result);
        
        // Store the file in formData
        setFormData({
          ...formData,
          imageFile: file
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name) {
      setError('Product name is required');
      return;
    }
    
    if (!formData.price) {
      setError('Price is required');
      return;
    }
    
    if (!formData.categoryId) {
      setError('Category is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Format the data for API
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        regular_price: formData.regular_price ? parseFloat(formData.regular_price) : null,
        quantity: parseInt(formData.quantity, 10),
        warranty_period: formData.warranty_period ? parseInt(formData.warranty_period, 10) : null,
        categoryId: parseInt(formData.categoryId, 10)
      };
      
      // Remove the imageFile from the data sent to createProduct
      const { imageFile, ...dataToSend } = productData;
      
      // Create product
      const response = await createProduct(dataToSend);
      const newProductId = response.data.product.productId;
      
      // If we have an image file, upload it
      if (imageFile) {
        await uploadProductImage(newProductId, imageFile);
      }
      
      setSuccessMessage('Product created successfully!');
      setLoading(false); 
      setTimeout(() => {
        navigate('/admin/products', { 
          state: { message: 'Product created successfully' } 
        });
      }, 1500);
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to create product. Please try again.');
      setLoading(false);
    }
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1 && (!formData.name || !formData.categoryId)) {
      setError('Product name and category are required');
      return;
    }
    
    if (currentStep === 2 && !formData.price) {
      setError('Price is required');
      return;
    }
    
    setError(null);
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Render basic information form (step 1)
  const renderBasicInfoForm = () => (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Basic Information</h2>
      
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Product Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter product name"
          required
        />
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <Link 
            to="/admin/categories"
            className="text-xs text-blue-600 hover:text-blue-800"
            title="Add a new category"
            target="_blank"
            rel="noopener noreferrer"
          >
            + Add New Category
          </Link>
        </div>
        <select
          id="categoryId"
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          required
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category.category_id} value={category.category_id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
          Brand
        </label>
        <input
          type="text"
          id="brand"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter brand name"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter product description"
        ></textarea>
      </div>
      
      <div className="mb-4">
        <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-1">
          Short Description
        </label>
        <textarea
          id="short_description"
          name="short_description"
          value={formData.short_description}
          onChange={handleChange}
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter a short description (max 150 characters)"
          maxLength="150"
        ></textarea>
        <p className="mt-1 text-xs text-gray-500">{formData.short_description.length}/150 characters</p>
      </div>
      
      <div className="mb-4">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>
      </div>
      
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="is_featured"
          name="is_featured"
          checked={formData.is_featured}
          onChange={handleChange}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
          Feature this product on the homepage
        </label>
      </div>
    </>
  );

  // Render pricing and inventory form (step 2)
  const renderPricingForm = () => (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Pricing & Inventory</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price (₹) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>
        
        <div>
          <label htmlFor="regular_price" className="block text-sm font-medium text-gray-700 mb-1">
            Regular Price (₹)
          </label>
          <input
            type="number"
            id="regular_price"
            name="regular_price"
            value={formData.regular_price}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <p className="mt-1 text-xs text-gray-500">Set regular price higher than sale price to show discount</p>
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
          SKU
        </label>
        <input
          type="text"
          id="sku"
          name="sku"
          value={formData.sku}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Stock Keeping Unit"
        />
        <p className="mt-1 text-xs text-gray-500">Leave blank to auto-generate</p>
      </div>
      
      <div className="mb-4">
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
          Stock Quantity
        </label>
        <input
          type="number"
          id="quantity"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="0"
          min="0"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter tags separated by commas"
        />
      </div>
    </>
  );

  // Render shipping and additional details form (step 3)
  const renderShippingForm = () => (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Shipping & Additional Details</h2>
      
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="free_shipping"
          name="free_shipping"
          checked={formData.free_shipping}
          onChange={handleChange}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <label htmlFor="free_shipping" className="ml-2 block text-sm text-gray-700">
          Free Shipping
        </label>
      </div>
      
      <div className="mb-4">
        <label htmlFor="shipping_time" className="block text-sm font-medium text-gray-700 mb-1">
          Shipping Time
        </label>
        <input
          type="text"
          id="shipping_time"
          name="shipping_time"
          value={formData.shipping_time}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="e.g. 3-5 business days"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="warranty_period" className="block text-sm font-medium text-gray-700 mb-1">
          Warranty Period (months)
        </label>
        <input
          type="number"
          id="warranty_period"
          name="warranty_period"
          value={formData.warranty_period}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="0"
          min="0"
        />
        <p className="mt-1 text-xs text-gray-500">Leave blank if no warranty</p>
      </div>
      
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="eco_friendly"
          name="eco_friendly"
          checked={formData.eco_friendly}
          onChange={handleChange}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <label htmlFor="eco_friendly" className="ml-2 block text-sm text-gray-700">
          Eco-Friendly Product
        </label>
      </div>
      
      <div className={`mb-4 ${!formData.eco_friendly ? 'opacity-50' : ''}`}>
        <label htmlFor="eco_friendly_details" className="block text-sm font-medium text-gray-700 mb-1">
          Eco-Friendly Details
        </label>
        <input
          type="text"
          id="eco_friendly_details"
          name="eco_friendly_details"
          value={formData.eco_friendly_details}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Describe eco-friendly aspects"
          disabled={!formData.eco_friendly}
        />
      </div>
    </>
  );

  // Render image upload form (step 4)
  const renderImageForm = () => (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Product Image</h2>
      
      <div className="mb-6">
        <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
          Product Image
        </label>
        <div className="flex items-center justify-center">
          <label className="flex flex-col items-center px-4 py-6 bg-white text-green-600 rounded-lg border-2 border-dashed border-green-400 hover:bg-green-50 cursor-pointer transition-colors">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="mt-2 text-base leading-normal">Upload an image</span>
            <input 
              type="file" 
              id="product_image" 
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>
      </div>
      
      {previewImage && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
          <div className="flex justify-center">
            <img 
              src={previewImage} 
              alt="Product preview" 
              className="max-h-64 rounded-lg shadow-md" 
            />
          </div>
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={() => {
                setPreviewImage(null);
                setFormData({...formData, imageFile: null});
              }}
              className="text-red-600 hover:text-red-800"
            >
              Remove Image
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <label htmlFor="image_url_direct" className="block text-sm font-medium text-gray-700 mb-2">
          Or enter an image URL directly
        </label>
        <input
          type="text"
          id="image_url_direct"
          name="image_url"
          value={!previewImage ? formData.image_url : ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="https://example.com/image.jpg"
          disabled={!!previewImage}
        />
        <p className="mt-1 text-xs text-gray-500">Use this if you have an image hosted elsewhere</p>
      </div>
    </>
  );

  // Render review and submit form (step 5)
  const renderReviewForm = () => (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Review & Submit</h2>
      
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <p className="text-green-800 font-medium">You're almost done! Please review the product details below before submitting.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-gray-700 border-b pb-2 mb-2">Basic Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {formData.name}</p>
            <p><span className="font-medium">Category:</span> {categories.find(c => c.category_id.toString() === formData.categoryId.toString())?.name || 'Not selected'}</p>
            <p><span className="font-medium">Brand:</span> {formData.brand || 'Not specified'}</p>
            <p><span className="font-medium">Status:</span> {formData.status}</p>
            <p><span className="font-medium">Featured:</span> {formData.is_featured ? 'Yes' : 'No'}</p>
          </div>
          
          <h3 className="font-medium text-gray-700 border-b pb-2 mt-4 mb-2">Pricing & Inventory</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Price:</span> ₹{formData.price}</p>
            {formData.regular_price && <p><span className="font-medium">Regular Price:</span> ₹{formData.regular_price}</p>}
            <p><span className="font-medium">SKU:</span> {formData.sku || 'Auto-generated'}</p>
            <p><span className="font-medium">Stock:</span> {formData.quantity}</p>
            {formData.tags && <p><span className="font-medium">Tags:</span> {formData.tags}</p>}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-700 border-b pb-2 mb-2">Shipping & Additional Details</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Free Shipping:</span> {formData.free_shipping ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Shipping Time:</span> {formData.shipping_time}</p>
            {formData.warranty_period && <p><span className="font-medium">Warranty:</span> {formData.warranty_period} months</p>}
            <p><span className="font-medium">Eco-Friendly:</span> {formData.eco_friendly ? 'Yes' : 'No'}</p>
            {formData.eco_friendly && <p><span className="font-medium">Eco-Friendly Details:</span> {formData.eco_friendly_details}</p>}
          </div>
          
          {(previewImage || formData.image_url) && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 border-b pb-2 mb-2">Product Image</h3>
              {previewImage ? (
                <div>
                  <img src={previewImage} alt="Product preview" className="max-h-40 rounded-lg mt-2" />
                  <p className="text-sm text-gray-600 mt-1">Image will be uploaded after submission</p>
                </div>
              ) : (
                <p>{formData.image_url}</p>
              )}
            </div>
          )}
          
          {formData.description && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 border-b pb-2 mb-2">Description</h3>
              <p className="text-sm text-gray-600 mt-2">{formData.description}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Render the current step form
  const renderStepForm = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoForm();
      case 2:
        return renderPricingForm();
      case 3:
        return renderShippingForm();
      case 4:
        return renderImageForm();
      case 5:
        return renderReviewForm();
      default:
        return renderBasicInfoForm();
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { number: 1, name: 'Basic Info' },
      { number: 2, name: 'Pricing' },
      { number: 3, name: 'Shipping' },
      { number: 4, name: 'Image' },
      { number: 5, name: 'Review' }
    ];

    return (
      <div className="mb-8">
        <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base">
          {steps.map(step => (
            <li key={step.number} className={`flex md:w-full items-center ${currentStep === step.number ? 'text-green-600 dark:text-green-500' : ''} ${currentStep > step.number ? 'text-green-600 dark:text-green-500' : ''}`}>
              <span className="flex items-center justify-center w-6 h-6 mr-2 text-xs border border-gray-300 rounded-full shrink-0 dark:border-gray-400 sm:w-8 sm:h-8 sm:text-sm">
                {currentStep > step.number ? (
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.number
                )}
              </span>
              <span className="hidden sm:inline-flex sm:ml-2">{step.name}</span>
              {step.number < steps.length && (
                <svg className="w-4 h-4 ml-2 sm:ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  };

  return (
    <div className="container px-4 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Create New Product</h1>
        <Link
          to="/admin/products"
          className="text-gray-600 hover:text-gray-900"
        >
          &larr; Back to Products
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <p>{successMessage}</p>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6">
        {renderStepIndicator()}
        
        <form onSubmit={handleSubmit}>
          {renderStepForm()}
          
          <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Previous
              </button>
            )}
            
            <div className="flex justify-end">
              <Link
                to="/admin/products"
                className="px-4 py-2 mr-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </Link>
              
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Creating...' : 'Create Product'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductCreate; 