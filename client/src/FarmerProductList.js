import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function FarmerProductList({ refresh }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/products/my-products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.message || 'Failed to fetch products');
        } else {
          setProducts(data.products);
        }
      } catch (err) {
        setError('Network error');
      }
      setLoading(false);
    };
    fetchProducts();
  }, [refresh]);

  const handleProductClick = product => {
    setSelectedProduct(product);
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
  };

  const handleDelete = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  return (
    <div>
      <h5 className="mb-3">My Products</h5>
      {loading && <div className="text-center my-3"><div className="spinner-border" /></div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {selectedProduct ? (
        <div className="eco-product-detail d-flex flex-wrap align-items-stretch" style={{background:'#e8f5e9', borderRadius:'1.5rem', boxShadow:'0 4px 24px rgba(34,139,34,0.10)', padding:'2.5rem 2rem', marginBottom:'2rem'}}>
          <div className="eco-product-detail-img" style={{flex:'0 0 340px', maxWidth:340, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', borderRadius:'1.2rem', boxShadow:'0 2px 12px rgba(34,139,34,0.08)', marginRight:'2.5rem', minHeight:320}}>
            {selectedProduct.image ? (
              <img src={`${process.env.REACT_APP_API_URL}/products/images/${selectedProduct.image}`} alt={selectedProduct.name} style={{maxWidth:'95%', maxHeight:300, borderRadius:'1.1rem'}} />
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
              <button className="btn btn-outline-secondary" onClick={handleCloseDetail}>Back</button>
              <button className="btn btn-outline-danger" onClick={() => handleDelete(selectedProduct.id)}>Delete</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="row">
          {products.map(product => (
            <div className="col-md-6 mb-3" key={product.id}>
              <div className="card h-100 shadow-sm eco-product-card" style={{cursor:'pointer'}} onClick={() => handleProductClick(product)}>
                {product.image && (
                  <img 
                    src={`${process.env.REACT_APP_API_URL}/products/images/${product.image}`} 
                    alt={product.name} 
                    className="card-img-top" 
                    style={{ maxHeight: 180, objectFit: 'cover' }} 
                  />
                )}
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <div className="mb-2 text-muted">{product.crop_type}</div>
                  <div>Price: ₹{product.price} / {product.unit}</div>
                  <div>Quantity: {product.quantity}</div>
                  {product.location && <div>Location: {product.location}</div>}
                  {product.description && <div className="mt-2"><small>{product.description}</small></div>}
                </div>
              </div>
            </div>
          ))}
          {(!loading && products.length === 0) && <div className="text-muted">No products found.</div>}
        </div>
      )}
    </div>
  );
}

export default FarmerProductList; 