import React, { useState } from 'react';
import OrderModal from './OrderModal';

function BuyerProductBrowse() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ crop_type: '', pin_code: '' });
  const [orderProduct, setOrderProduct] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchProducts = async () => {
    if (!filters.crop_type.trim()) {
      setError('Please enter a crop type to search');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.crop_type) params.append('crop_type', filters.crop_type);
      if (filters.pin_code) params.append('pin_code', filters.pin_code);
      const res = await fetch(`${API_URL}/api/products?${params.toString()}`);
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to fetch products');
      } else {
        setProducts(data.products);
        setHasSearched(true);
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleFilterChange = e => {
    setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleFilterSubmit = e => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOrderClick = product => {
    setOrderProduct(product);
    setOrderSuccess('');
  };

  const handleOrderPlaced = () => {
    setOrderSuccess('Order placed successfully!');
    setOrderProduct(null);
  };

  const handleProductClick = product => {
    setSelectedProduct(product);
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
  };

  return (
    <div>
      <h3 className="mb-4 text-center" style={{ color: '#388e3c', fontWeight: 600 }}>Search for Fresh Crops</h3>
      
      {!hasSearched && (
        <div className="text-center mb-4">
          <p className="text-muted">Enter a crop type to find fresh products from local farmers</p>
        </div>
      )}
      
      <form className="row g-3 mb-4" onSubmit={handleFilterSubmit}>
        <div className="col-md-5">
          <input 
            type="text" 
            className="form-control eco-input" 
            name="crop_type" 
            placeholder="Enter crop type (e.g., tomatoes, rice, wheat)" 
            value={filters.crop_type} 
            onChange={handleFilterChange}
            required
          />
        </div>
        <div className="col-md-4">
          <input 
            type="text" 
            className="form-control eco-input" 
            name="pin_code" 
            placeholder="Farmer PIN Code (optional)" 
            value={filters.pin_code} 
            onChange={handleFilterChange} 
          />
        </div>
        <div className="col-md-3">
          <button type="submit" className="btn eco-btn w-100" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      
      {orderSuccess && <div className="alert alert-success">{orderSuccess}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-success" />
          <p className="mt-2">Searching for fresh crops...</p>
        </div>
      )}
      
      {selectedProduct ? (
        <div className="eco-product-detail d-flex flex-wrap align-items-stretch" style={{background:'#e8f5e9', borderRadius:'1.5rem', boxShadow:'0 4px 24px rgba(34,139,34,0.10)', padding:'2.5rem 2rem', marginBottom:'2rem'}}>
          <div className="eco-product-detail-img" style={{flex:'0 0 340px', maxWidth:340, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', borderRadius:'1.2rem', boxShadow:'0 2px 12px rgba(34,139,34,0.08)', marginRight:'2.5rem', minHeight:320}}>
            {selectedProduct.image ? (
              <img src={`${API_URL}/api/products/images/${selectedProduct.image}`} alt={selectedProduct.name} style={{maxWidth:'95%', maxHeight:300, borderRadius:'1.1rem'}} />
            ) : (
              <div className="text-muted">No image</div>
            )}
          </div>
          <div className="eco-product-detail-info" style={{flex:1, minWidth:220, display:'flex', flexDirection:'column', justifyContent:'center'}}>
            <h2 style={{color:'#204d2a', fontWeight:700, fontFamily:'Montserrat, sans-serif'}}>{selectedProduct.name}</h2>
            <div className="mb-2" style={{color:'#388e3c', fontWeight:600}}>{selectedProduct.crop_type}</div>
            <div style={{fontSize:'1.1rem', marginBottom:8}}>Price: <span style={{color:'#388e3c', fontWeight:600}}>₹{selectedProduct.price}</span> / {selectedProduct.unit}</div>
            <div style={{fontSize:'1.1rem', marginBottom:8}}>Quantity: <span style={{color:'#388e3c', fontWeight:600}}>{selectedProduct.quantity}</span></div>
            {selectedProduct.location && <div style={{fontSize:'1.1rem', marginBottom:8}}>Location: <span style={{color:'#388e3c', fontWeight:600}}>{selectedProduct.location}</span></div>}
            <div style={{fontSize:'1.1rem', marginBottom:8}}>Farmer PIN: <span style={{color:'#388e3c', fontWeight:600}}>{selectedProduct.farmer_pin}</span></div>
            {selectedProduct.description && <div className="mt-2 mb-2" style={{fontSize:'1.05rem', color:'#204d2a'}}>{selectedProduct.description}</div>}
            <div className="d-flex gap-3 mt-3">
              <button className="btn eco-btn" onClick={() => handleOrderClick(selectedProduct)}>Order</button>
              <button className="btn btn-outline-secondary" onClick={handleCloseDetail}>Back</button>
            </div>
          </div>
        </div>
      ) : hasSearched && !loading && (
        <div>
          {products.length > 0 ? (
            <div className="row">
              {products.map(product => (
                <div className="col-md-4 mb-4" key={product.id}>
                  <div className="card h-100 shadow-sm eco-product-card" style={{cursor:'pointer'}} onClick={() => handleProductClick(product)}>
                    {product.image && (
                      <img src={`${API_URL}/api/products/images/${product.image}`} alt={product.name} className="card-img-top" style={{ maxHeight: 180, objectFit: 'cover' }} />
                    )}
                    <div className="card-body">
                      <h5 className="card-title">{product.name}</h5>
                      <div className="mb-2 text-muted">{product.crop_type}</div>
                      <div>Price: ₹{product.price} / {product.unit}</div>
                      <div>Quantity: {product.quantity}</div>
                      {product.location && <div>Location: {product.location}</div>}
                      <div>Farmer PIN: {product.farmer_pin}</div>
                      {product.description && <div className="mt-2"><small>{product.description}</small></div>}
                      <button className="btn btn-success mt-3 w-100" onClick={e => { e.stopPropagation(); handleOrderClick(product); }}>Order</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center my-4">
              <p className="text-muted">No products found for "{filters.crop_type}". Try a different crop type or PIN code.</p>
            </div>
          )}
        </div>
      )}
      
      <OrderModal show={!!orderProduct} onClose={() => setOrderProduct(null)} product={orderProduct} onOrderPlaced={handleOrderPlaced} />
    </div>
  );
}

export default BuyerProductBrowse; 