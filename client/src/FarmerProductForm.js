import React, { useState } from 'react';

function FarmerProductForm({ onProductAdded }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    crop_type: '',
    price: '',
    quantity: '',
    unit: '',
    location: '',
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setForm(f => ({ ...f, image: files[0] }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });
      const res = await fetch('http://localhost:5000/api/products/add', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || 'Failed to add product');
      } else {
        setSuccess('Product added successfully!');
        setForm({ name: '', description: '', crop_type: '', price: '', quantity: '', unit: '', location: '', image: null });
        if (onProductAdded) onProductAdded(result.product);
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 border p-3 rounded bg-light shadow-sm">
      <h5 className="mb-3">Add New Product</h5>
      <div className="row">
        <div className="col-md-6 mb-3">
          <input type="text" className="form-control" name="name" placeholder="Product Name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="col-md-6 mb-3">
          <input type="text" className="form-control" name="crop_type" placeholder="Crop Type" value={form.crop_type} onChange={handleChange} required />
        </div>
        <div className="col-md-6 mb-3">
          <input type="number" className="form-control" name="price" placeholder="Price" value={form.price} onChange={handleChange} required />
        </div>
        <div className="col-md-6 mb-3">
          <input type="number" className="form-control" name="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} required />
        </div>
        <div className="col-md-6 mb-3">
          <input type="text" className="form-control" name="unit" placeholder="Unit (e.g. kg, quintal)" value={form.unit} onChange={handleChange} required />
        </div>
        <div className="col-md-6 mb-3">
          <input type="text" className="form-control" name="location" placeholder="Location (optional)" value={form.location} onChange={handleChange} />
        </div>
        <div className="col-12 mb-3">
          <textarea className="form-control" name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} rows={2} />
        </div>
        <div className="col-12 mb-3">
          <input type="file" className="form-control" name="image" accept="image/*" onChange={handleChange} />
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <button type="submit" className="btn btn-success" disabled={loading}>{loading ? 'Adding...' : 'Add Product'}</button>
    </form>
  );
}

export default FarmerProductForm; 