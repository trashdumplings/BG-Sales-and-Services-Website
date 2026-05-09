import React, { useState, useEffect } from 'react';
import { getInventoryItems } from '../../../utils/api';
import { useAuth } from '../../../stores/AuthProvider';
import { LuSearch, LuFilter, LuPlus, LuPackage, LuTriangleAlert, LuArrowUpDown } from 'react-icons/lu';
import './InventoryList.css';

const InventoryList = () => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    quantity: 0,
    unit_price: 0,
    supplier: '',
    location: '',
    reorder_level: 10
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getInventoryItems(token);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchItems();
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/api/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          unit_price: parseFloat(formData.unit_price),
          reorder_level: parseInt(formData.reorder_level)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add item');
      }

      await fetchItems();
      setShowModal(false);
      setFormData({
        sku: '',
        name: '',
        description: '',
        category: '',
        quantity: 0,
        unit_price: 0,
        supplier: '',
        location: '',
        reorder_level: 10
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustQuantity = async (itemId, change) => {
     try {
       const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/api/inventory/${itemId}/adjust`, {
         method: 'PATCH',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify({ quantity_change: change })
       });
       if (!response.ok) throw new Error('Adjustment failed');
       await fetchItems();
     } catch (err) {
       alert(err.message);
     }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(items.map(i => i.category))];

  if (loading) return <div className="loading-state">Loading inventory...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="inventory-list-container">
      <div className="list-controls">
        <div className="search-box">
          <LuSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search SKU or Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-select">
            <LuFilter className="filter-icon" />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <button className="add-btn" onClick={() => setShowModal(true)}>
            <LuPlus />
            <span>New Item</span>
          </button>
        </div>
      </div>

      <div className="inventory-table-wrap">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id}>
                <td>
                  <div className="item-cell">
                    <LuPackage className="item-icon" />
                    <div className="item-info">
                      <div className="item-name">{item.name} <span className={`cms-badge ${item.cms_status}`}>{item.cms_status}</span></div>
                      <div className="item-location">{item.location || 'No location'} (v{item.version})</div>
                    </div>
                  </div>
                </td>
                <td className="sku-cell">{item.sku}</td>
                <td>{item.category}</td>
                <td>
                  <div className="qty-cell">
                    <span className="qty-val">{item.quantity}</span>
                    {item.quantity < item.reorder_level && (
                      <LuTriangleAlert className="low-stock-alert" title="Low stock alert" />
                    )}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${item.status}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
                <td>${item.unit_price}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className={`cms-btn ${item.cms_status === 'published' ? 'unpublish' : 'publish'}`}
                      onClick={async () => {
                        const newStatus = item.cms_status === 'published' ? 'draft' : 'published';
                        try {
                          const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/api/inventory/${item.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ cms_status: newStatus })
                          });
                          if (res.ok) fetchItems();
                        } catch (err) { alert(err.message); }
                      }}
                    >
                      {item.cms_status === 'published' ? 'Draft' : 'Publish'}
                    </button>
                    <button className="qty-btn plus" onClick={() => handleAdjustQuantity(item.id, 1)}>+</button>
                    <button className="qty-btn minus" onClick={() => handleAdjustQuantity(item.id, -1)}>-</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Item</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddSubmit} className="employee-form">
              <div className="form-row">
                <div className="form-group">
                  <label>SKU</label>
                  <input name="sku" value={formData.sku} onChange={handleInputChange} required placeholder="INV-001" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input name="category" value={formData.category} onChange={handleInputChange} required placeholder="Electronics" />
                </div>
              </div>
              <div className="form-group">
                <label>Item Name</label>
                <input name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input name="description" value={formData.description} onChange={handleInputChange} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Unit Price</label>
                  <input type="number" name="unit_price" value={formData.unit_price} onChange={handleInputChange} step="0.01" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier</label>
                  <input name="supplier" value={formData.supplier} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input name="location" value={formData.location} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Reorder Level</label>
                <input type="number" name="reorder_level" value={formData.reorder_level} onChange={handleInputChange} />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
