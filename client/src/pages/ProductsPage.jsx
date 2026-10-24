import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Package,
  Eye,
  AlertCircle
} from 'lucide-react';
import { productService, categoryService, supplierService } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import NotificationToast from '../components/NotificationToast';

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [stockStatus, setStockStatus] = useState(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Delete confirm dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState(null);

  // Form State
  const initialFormData = {
    name: '',
    sku: '',
    description: '',
    category_id: '',
    supplier_id: '',
    unit_price: '',
    initial_quantity: '',
    minimum_stock: '5',
    unit: 'pcs',
    image_url: '',
    imageFile: null
  };
  const [formData, setFormData] = useState(initialFormData);
  const [imagePreview, setImagePreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const fetchDropdownData = async () => {
    try {
      const [catsRes, supsRes] = await Promise.all([
        categoryService.getAll(),
        supplierService.getAll()
      ]);
      if (catsRes.success) setCategories(catsRes.categories || []);
      if (supsRes.success) setSuppliers(supsRes.suppliers || []);
    } catch (e) {
      console.error('Failed to load categories/suppliers', e);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getAll({
        search,
        category_id: selectedCategory,
        status: stockStatus,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit: 15
      });
      if (res.success) {
        setProducts(res.products || []);
        setTotalPages(res.totalPages || 1);
        setTotalProducts(res.total || 0);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, stockStatus, sortBy, sortOrder, page]);

  // Handle open Add Modal
  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedProduct(null);
    setFormData({
      ...initialFormData,
      category_id: categories[0]?.id || ''
    });
    setImagePreview(null);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Handle open Edit Modal
  const handleOpenEdit = (product) => {
    setIsEditing(true);
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category_id: product.category_id,
      supplier_id: product.supplier_id || '',
      unit_price: product.unit_price,
      initial_quantity: product.quantity,
      minimum_stock: product.minimum_stock,
      unit: product.unit || 'pcs',
      image_url: product.image_url || '',
      imageFile: null
    });
    setImagePreview(product.image_url || null);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Handle open Details Modal
  const handleOpenDetails = async (product) => {
    try {
      const res = await productService.getById(product.id);
      if (res.success) {
        setSelectedProduct(res.product);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  // Form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (!formData.category_id) errors.category_id = 'Category is required';
    if (formData.unit_price === '' || Number(formData.unit_price) < 0) errors.unit_price = 'Valid unit price is required';
    if (formData.minimum_stock === '' || Number(formData.minimum_stock) < 0) errors.minimum_stock = 'Minimum stock is required';
    if (!isEditing && (formData.initial_quantity === '' || Number(formData.initial_quantity) < 0)) {
      errors.initial_quantity = 'Valid initial quantity is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setFormSubmitting(true);
      if (isEditing) {
        await productService.update(selectedProduct.id, {
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          category_id: formData.category_id,
          supplier_id: formData.supplier_id || null,
          unit_price: Number(formData.unit_price),
          minimum_stock: Number(formData.minimum_stock),
          unit: formData.unit,
          image_url: formData.image_url,
          imageFile: formData.imageFile
        });
        setToast({ type: 'success', message: `Product "${formData.name}" updated successfully!` });
      } else {
        await productService.create(formData);
        setToast({ type: 'success', message: `Product "${formData.name}" added to inventory!` });
      }
      setIsFormModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormErrors({ submit: err.message });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete / Archive
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await productService.delete(productToDelete.id);
      setToast({ type: 'success', message: res.message || 'Product removed successfully' });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Supplier', 'Unit Price ($)', 'Available Qty', 'Min Stock', 'Unit', 'Status'];
    const rows = products.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      `"${p.category_name || ''}"`,
      `"${p.supplier_name || 'N/A'}"`,
      p.unit_price.toFixed(2),
      p.quantity,
      p.minimum_stock,
      p.unit,
      p.stock_status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockSmart_Products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#101A46', letterSpacing: '-0.4px' }}>
            Products
          </h2>
          <p style={{ fontSize: '14px', color: '#727D9E', marginTop: '4px' }}>
            Manage your inventory catalog, pricing, and minimum stock buffers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="stock-card"
        style={{
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
          <Search size={18} color="#727D9E" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by product name or SKU..."
            style={{
              width: '100%',
              height: '40px',
              paddingLeft: '40px',
              paddingRight: '14px',
              background: '#F6F8FF',
              border: '1px solid #E7ECF7',
              borderRadius: '10px',
              fontSize: '13.5px'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            style={{
              height: '40px',
              background: '#F6F8FF',
              border: '1px solid #E7ECF7',
              borderRadius: '10px',
              padding: '0 14px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#576282'
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(1);
            }}
            style={{
              height: '40px',
              background: '#F6F8FF',
              border: '1px solid #E7ECF7',
              borderRadius: '10px',
              padding: '0 14px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#576282'
            }}
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (At/Below Min)</option>
            <option value="out_of_stock">Out of Stock (Zero)</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              height: '40px',
              background: '#F6F8FF',
              border: '1px solid #E7ECF7',
              borderRadius: '10px',
              padding: '0 14px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#576282'
            }}
          >
            <option value="name">Sort by: Name</option>
            <option value="sku">Sort by: SKU</option>
            <option value="unit_price">Sort by: Price</option>
            <option value="quantity">Sort by: Quantity</option>
            <option value="minimum_stock">Sort by: Min Threshold</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
            className="btn-secondary"
            style={{ height: '40px', padding: '0 12px' }}
            title={`Order: ${sortOrder}`}
          >
            <ArrowUpDown size={16} />
            <span>{sortOrder}</span>
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="stock-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Unit Price</th>
                <th>Stock Units</th>
                <th>Min Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#727D9E' }}>
                    Loading product inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#727D9E' }}>
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isOut = p.quantity === 0;
                  const isLow = p.quantity <= p.minimum_stock && p.quantity > 0;
                  return (
                    <tr key={p.id}>
                      {/* Product Name with Thumbnail */}
                      <td style={{ paddingLeft: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: '#F6F8FF',
                              border: '1px solid #E7ECF7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              flexShrink: 0
                            }}
                          >
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Package size={20} color="#727D9E" />
                            )}
                          </div>
                          <div>
                            <span style={{ fontWeight: '700', color: '#101A46', display: 'block' }}>
                              {p.name}
                            </span>
                            <span style={{ fontSize: '11px', color: '#727D9E' }}>
                              {p.unit}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#576282', background: '#F1F4FA', padding: '3px 8px', borderRadius: '6px' }}>
                          {p.sku}
                        </span>
                      </td>

                      {/* Category */}
                      <td>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            background: p.category_color ? `${p.category_color}18` : '#EEF2FF',
                            color: p.category_color || '#405BFF'
                          }}
                        >
                          {p.category_name}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td style={{ color: '#576282', fontSize: '13px' }}>
                        {p.supplier_name || '—'}
                      </td>

                      {/* Unit Price */}
                      <td style={{ fontWeight: '700', color: '#101A46' }}>
                        ${p.unit_price.toFixed(2)}
                      </td>

                      {/* Available Quantity */}
                      <td>
                        <span
                          style={{
                            fontWeight: '800',
                            fontSize: '14px',
                            color: isOut ? '#DC2626' : isLow ? '#FF525C' : '#101A46'
                          }}
                        >
                          {p.quantity.toLocaleString()}
                        </span>
                      </td>

                      {/* Min Stock */}
                      <td style={{ color: '#727D9E', fontSize: '13px' }}>
                        {p.minimum_stock}
                      </td>

                      {/* Stock Status Badge */}
                      <td>
                        {isOut ? (
                          <span className="badge-out-of-stock">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge-low-stock">Low Stock</span>
                        ) : (
                          <span className="badge-in-stock">In Stock</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenDetails(p)}
                            title="View Details"
                            style={{
                              padding: '6px',
                              borderRadius: '8px',
                              color: '#727D9E',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#F6F8FF'; e.currentTarget.style.color = '#405BFF'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#727D9E'; }}
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Product"
                            style={{
                              padding: '6px',
                              borderRadius: '8px',
                              color: '#727D9E',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#F6F8FF'; e.currentTarget.style.color = '#405BFF'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#727D9E'; }}
                          >
                            <Edit2 size={17} />
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete(p);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete / Archive Product"
                            style={{
                              padding: '6px',
                              borderRadius: '8px',
                              color: '#727D9E',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#FFF1F0'; e.currentTarget.style.color = '#FF525C'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#727D9E'; }}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E7ECF7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: '#727D9E'
          }}
        >
          <span>Showing {products.length} of {totalProducts} products</span>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontWeight: '600', color: '#101A46' }}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={isEditing ? `Edit Product: ${selectedProduct?.name}` : 'Add New Inventory Product'}
        maxWidth="640px"
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {formErrors.submit && (
            <div style={{ background: '#FFF1F0', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '13px' }}>
              {formErrors.submit}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Precision Digital Multimeter"
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: `1px solid ${formErrors.name ? '#FF525C' : '#E7ECF7'}`,
                  background: '#F9FAFF',
                  fontSize: '13.5px'
                }}
              />
              {formErrors.name && <span style={{ color: '#FF525C', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>{formErrors.name}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                SKU * (Unique Identifier)
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. LAB-DMM-001"
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: `1px solid ${formErrors.sku ? '#FF525C' : '#E7ECF7'}`,
                  background: '#F9FAFF',
                  fontSize: '13.5px',
                  fontFamily: 'monospace'
                }}
              />
              {formErrors.sku && <span style={{ color: '#FF525C', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>{formErrors.sku}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: `1px solid ${formErrors.category_id ? '#FF525C' : '#E7ECF7'}`,
                  background: '#F9FAFF',
                  fontSize: '13.5px'
                }}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {formErrors.category_id && <span style={{ color: '#FF525C', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>{formErrors.category_id}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                Supplier (Optional)
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #E7ECF7',
                  background: '#F9FAFF',
                  fontSize: '13.5px'
                }}
              >
                <option value="">None / Unassigned</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                Unit Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="0.00"
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: `1px solid ${formErrors.unit_price ? '#FF525C' : '#E7ECF7'}`,
                  background: '#F9FAFF',
                  fontSize: '13.5px'
                }}
              />
              {formErrors.unit_price && <span style={{ color: '#FF525C', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>{formErrors.unit_price}</span>}
            </div>

            {!isEditing && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                  Initial Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.initial_quantity}
                  onChange={(e) => setFormData({ ...formData, initial_quantity: e.target.value })}
                  placeholder="25"
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: `1px solid ${formErrors.initial_quantity ? '#FF525C' : '#E7ECF7'}`,
                    background: '#F9FAFF',
                    fontSize: '13.5px'
                  }}
                />
                {formErrors.initial_quantity && <span style={{ color: '#FF525C', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>{formErrors.initial_quantity}</span>}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                Min Stock Threshold *
              </label>
              <input
                type="number"
                min="0"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                placeholder="5"
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: `1px solid ${formErrors.minimum_stock ? '#FF525C' : '#E7ECF7'}`,
                  background: '#F9FAFF',
                  fontSize: '13.5px'
                }}
              />
              {formErrors.minimum_stock && <span style={{ color: '#FF525C', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>{formErrors.minimum_stock}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                Unit of Measure
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #E7ECF7',
                  background: '#F9FAFF',
                  fontSize: '13.5px'
                }}
              >
                <option value="pcs">pcs</option>
                <option value="units">units</option>
                <option value="kits">kits</option>
                <option value="rolls">rolls</option>
                <option value="packs">packs</option>
                <option value="boxes">boxes</option>
                <option value="pairs">pairs</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                Product Image (optional)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && file.size > 5 * 1024 * 1024) {
                    setFormErrors({ ...formErrors, image: 'Image must be 5 MB or smaller.' });
                    setFormData({ ...formData, imageFile: null });
                    setImagePreview(isEditing ? selectedProduct?.image_url || null : null);
                    e.target.value = '';
                    return;
                  }
                  if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                    setFormErrors({ ...formErrors, image: 'Choose a JPEG, PNG, or WebP image.' });
                    setFormData({ ...formData, imageFile: null });
                    setImagePreview(isEditing ? selectedProduct?.image_url || null : null);
                    e.target.value = '';
                    return;
                  }
                  setFormErrors({ ...formErrors, image: '' });
                  setFormData({ ...formData, imageFile: file });
                  if (file) {
                    setImagePreview(URL.createObjectURL(file));
                  } else {
                    setImagePreview(isEditing ? selectedProduct?.image_url || null : null);
                  }
                }}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #E7ECF7',
                  background: '#F9FAFF',
                  fontSize: '13.5px'
                }}
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" style={{ maxHeight: '120px', marginTop: '8px' }} />
              )}
              {formErrors.image && <p style={{ color: '#DC2626', fontSize: '12px' }}>{formErrors.image}</p>}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
              Product Description
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Technical specifications, location details, model number..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #E7ECF7',
                background: '#F9FAFF',
                fontSize: '13.5px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => {
                setIsFormModalOpen(false);
                setImagePreview(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="btn-primary"
            >
              {formSubmitting ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Product Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedProduct?.name || 'Product Details'}
        maxWidth="680px"
      >
        {selectedProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '14px',
                  background: '#F6F8FF',
                  border: '1px solid #E7ECF7',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Package size={36} color="#727D9E" />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#101A46' }}>
                    {selectedProduct.name}
                  </h3>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', background: '#F1F4FA', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                    {selectedProduct.sku}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#576282', lineHeight: '1.4' }}>
                  {selectedProduct.description || 'No detailed description provided.'}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div style={{ background: '#F9FAFF', border: '1px solid #E7ECF7', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#727D9E', display: 'block' }}>Unit Price</span>
                <strong style={{ fontSize: '16px', color: '#101A46' }}>${selectedProduct.unit_price.toFixed(2)}</strong>
              </div>
              <div style={{ background: '#F9FAFF', border: '1px solid #E7ECF7', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#727D9E', display: 'block' }}>Current Stock</span>
                <strong style={{ fontSize: '16px', color: selectedProduct.quantity <= selectedProduct.minimum_stock ? '#FF525C' : '#16B979' }}>
                  {selectedProduct.quantity} {selectedProduct.unit}
                </strong>
              </div>
              <div style={{ background: '#F9FAFF', border: '1px solid #E7ECF7', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#727D9E', display: 'block' }}>Min Buffer</span>
                <strong style={{ fontSize: '16px', color: '#576282' }}>{selectedProduct.minimum_stock} {selectedProduct.unit}</strong>
              </div>
              <div style={{ background: '#F9FAFF', border: '1px solid #E7ECF7', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#727D9E', display: 'block' }}>Total Value</span>
                <strong style={{ fontSize: '16px', color: '#101A46' }}>
                  ${(selectedProduct.quantity * selectedProduct.unit_price).toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Category & Supplier */}
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#576282', padding: '12px 16px', background: '#F6F8FF', borderRadius: '12px' }}>
              <div>Category: <strong style={{ color: '#101A46' }}>{selectedProduct.category_name}</strong></div>
              <div>Supplier: <strong style={{ color: '#101A46' }}>{selectedProduct.supplier_name || 'Unassigned'}</strong></div>
            </div>

            {/* Recent Audit Transactions */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#101A46', marginBottom: '10px' }}>
                Audit Stock Movement Log
              </h4>
              {selectedProduct.transactions && selectedProduct.transactions.length > 0 ? (
                <div style={{ border: '1px solid #E7ECF7', borderRadius: '10px', overflow: 'hidden' }}>
                  <table className="data-table" style={{ fontSize: '12.5px' }}>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Qty</th>
                        <th>Prev</th>
                        <th>New</th>
                        <th>Ref / Reason</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProduct.transactions.map((t) => (
                        <tr key={t.id}>
                          <td><span className={t.type === 'IN' ? 'badge-in' : 'badge-out'}>{t.type}</span></td>
                          <td style={{ fontWeight: '700', color: t.type === 'IN' ? '#16B979' : '#FF525C' }}>
                            {t.type === 'IN' ? `+${t.quantity}` : `-${t.quantity}`}
                          </td>
                          <td>{t.previous_quantity}</td>
                          <td style={{ fontWeight: '600' }}>{t.new_quantity}</td>
                          <td style={{ color: '#576282' }}>{t.reference_number} ({t.reason})</td>
                          <td style={{ color: '#727D9E' }}>{t.created_at.slice(0, 16)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: '12.5px', color: '#727D9E' }}>No historical transactions recorded for this product.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Deletion / Archival */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete / Archive Product"
        message={`Are you sure you want to remove "${productToDelete?.name}"? If historical stock intake/issue records exist, this item will be safely archived to preserve audit compliance rather than permanently deleted.`}
        confirmText="Confirm Remove"
        isLoading={deleteLoading}
      />

      {/* Feedback Toast */}
      <NotificationToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default ProductsPage;
