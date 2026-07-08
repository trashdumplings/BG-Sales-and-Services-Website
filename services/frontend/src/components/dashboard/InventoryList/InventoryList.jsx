import React, { useState, useEffect } from 'react';
import {
  adjustInventoryQuantity,
  createInventoryItem,
  getInventoryItems,
  updateInventoryItem,
} from '../../../utils/api';
import { useAuth } from '../../../stores/AuthProvider';
import { LuSearch, LuFilter, LuPlus, LuPackage, LuTriangleAlert } from 'react-icons/lu';
import DashboardTable from '../../common/DashboardTable/DashboardTable';
import './InventoryList.css';

const inventoryCategoryCodeMap = {
  electronics: 'ELE',
  networking: 'NET',
  printers: 'PRI',
  printer: 'PRI',
  laptops: 'LAP',
  laptop: 'LAP',
  desktops: 'DES',
  desktop: 'DES',
  accessories: 'ACC',
  power: 'PWR',
  security: 'SEC',
  audiovisual: 'AV',
}

const generateInventorySku = (category, items) => {
  const normalizedCategory = category.trim().toLowerCase()
  const code = inventoryCategoryCodeMap[normalizedCategory] || 'GEN'
  const count = items.filter((item) => item.category?.trim().toLowerCase() === normalizedCategory).length + 1
  return `INV-${code}-${String(count).padStart(3, '0')}`
}

const inventoryColumns = [
  { key: 'item', label: 'Item', width: '30%' },
  { key: 'sku', label: 'SKU', width: '13%' },
  { key: 'category', label: 'Category', width: '14%' },
  { key: 'quantity', label: 'Quantity', align: 'right', width: '11%' },
  { key: 'status', label: 'Status', width: '12%' },
  { key: 'price', label: 'Price', align: 'right', width: '10%' },
  { key: 'actions', label: 'Actions', align: 'right', width: '10%' },
];

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

  useEffect(() => {
    if (!showModal) return

    setFormData((prev) => {
      const nextSku = generateInventorySku(prev.category, items)
      if (prev.sku === nextSku) return prev
      return { ...prev, sku: nextSku }
    })
  }, [items, showModal, formData.category])

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createInventoryItem(token, {
        ...formData,
        quantity: parseInt(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        reorder_level: parseInt(formData.reorder_level)
      });

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
       await adjustInventoryQuantity(token, itemId, change);
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
          <button
            className="add-btn"
            onClick={() => {
              setFormData({
                sku: generateInventorySku('', items),
                name: '',
                description: '',
                category: '',
                quantity: 0,
                unit_price: 0,
                supplier: '',
                location: '',
                reorder_level: 10
              });
              setShowModal(true);
            }}
          >
            <LuPlus />
            <span>New Item</span>
          </button>
        </div>
      </div>

      <DashboardTable
        columns={inventoryColumns}
        rows={filteredItems}
        rowKey="id"
        minWidth={980}
        emptyTitle="No inventory items found"
        emptyDescription="Add a new item or adjust your search and filters."
        renderCell={(item, column) => {
          switch (column.key) {
            case 'item':
              return (
                <div className="item-cell">
                  <LuPackage className="item-icon" />
                  <div className="item-info">
                    <div className="item-name">{item.name} <span className={`cms-badge ${item.cms_status}`}>{item.cms_status}</span></div>
                    <div className="item-location">{item.location || 'No location'} (v{item.version})</div>
                  </div>
                </div>
              );
            case 'sku':
              return <span className="sku-cell">{item.sku}</span>;
            case 'category':
              return item.category;
            case 'quantity':
              return (
                <div className="qty-cell">
                  <span className="qty-val">{item.quantity}</span>
                  {item.quantity < item.reorder_level && (
                    <LuTriangleAlert className="low-stock-alert" title="Low stock alert" />
                  )}
                </div>
              );
            case 'status':
              return (
                <span className={`status-badge ${item.status}`}>
                  {item.status.replace('_', ' ')}
                </span>
              );
            case 'price':
              return `$${item.unit_price}`;
            case 'actions':
              return (
                <div className="action-buttons">
                  <button 
                    className={`cms-btn ${item.cms_status === 'published' ? 'unpublish' : 'publish'}`}
                    onClick={async () => {
                      const newStatus = item.cms_status === 'published' ? 'draft' : 'published';
                      try {
                        await updateInventoryItem(token, item.id, { cms_status: newStatus });
                        fetchItems();
                      } catch (err) { alert(err.message); }
                    }}
                  >
                    {item.cms_status === 'published' ? 'Draft' : 'Publish'}
                  </button>
                  <button className="qty-btn plus" onClick={() => handleAdjustQuantity(item.id, 1)}>+</button>
                  <button className="qty-btn minus" onClick={() => handleAdjustQuantity(item.id, -1)}>-</button>
                </div>
              );
            default:
              return null;
          }
        }}
      />

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
                  <input
                    name="sku"
                    value={formData.sku}
                    readOnly
                    required
                    placeholder="Auto-generated"
                  />
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
