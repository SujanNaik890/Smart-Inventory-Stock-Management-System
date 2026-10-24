import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderTree,
  Plus,
  Search,
  Package,
  Edit2,
  Trash2,
  Cpu,
  Headphones,
  Armchair,
  Microscope,
  Box,
  Layers
} from 'lucide-react';
import { categoryService } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import NotificationToast from '../components/NotificationToast';

const PRESET_COLORS = [
  '#405BFF',
  '#8267F5',
  '#16B979',
  '#FF9B38',
  '#EC4899',
  '#06B6D4',
  '#727D9E'
];

export const CategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form State
  const initialFormData = {
    name: '',
    description: '',
    color: '#405BFF',
    icon: 'Folder'
  };
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getAll();
      if (res.success) {
        setCategories(res.categories || []);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedCategory(null);
    setFormData(initialFormData);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setIsEditing(true);
    setSelectedCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      color: cat.color || '#405BFF',
      icon: cat.icon || 'Folder'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormErrors({ name: 'Category name is required' });
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await categoryService.update(selectedCategory.id, formData);
        setToast({ type: 'success', message: `Category "${formData.name}" updated successfully.` });
      } else {
        await categoryService.create(formData);
        setToast({ type: 'success', message: `Category "${formData.name}" created successfully.` });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setFormErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!catToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await categoryService.delete(catToDelete.id);
      setToast({ type: 'success', message: res.message });
      setDeleteOpen(false);
      setCatToDelete(null);
      fetchCategories();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#101A46', letterSpacing: '-0.4px' }}>
            Product Categories
          </h2>
          <p style={{ fontSize: '14px', color: '#727D9E', marginTop: '4px' }}>
            Segment your equipment and materials to streamline inventory tracking.
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search & Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
        <div className="stock-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#405BFF' }}>
            <FolderTree size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#727D9E', fontWeight: '600' }}>Total Categories</span>
            <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#101A46' }}>{categories.length}</h4>
          </div>
        </div>

        <div className="stock-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#E8FBF3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16B979' }}>
            <Package size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#727D9E', fontWeight: '600' }}>Classified Products</span>
            <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#101A46' }}>
              {categories.reduce((sum, c) => sum + (c.product_count || 0), 0)} items
            </h4>
          </div>
        </div>

        <div className="stock-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} color="#727D9E" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
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
        </div>
      </div>

      {/* Categories Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}
      >
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="stock-card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top Accent Strip */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: cat.color || '#405BFF'
              }}
            />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: `${cat.color || '#405BFF'}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: cat.color || '#405BFF'
                    }}
                  >
                    <FolderTree size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#101A46' }}>
                      {cat.name}
                    </h3>
                    <span style={{ fontSize: '11px', color: '#727D9E' }}>
                      ID: #{cat.id}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    style={{ padding: '6px', borderRadius: '8px', color: '#727D9E' }}
                    title="Edit Category"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setCatToDelete(cat);
                      setDeleteOpen(true);
                    }}
                    style={{ padding: '6px', borderRadius: '8px', color: '#727D9E' }}
                    title="Delete Category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#576282', lineHeight: '1.45', marginBottom: '18px', minHeight: '38px' }}>
                {cat.description || 'No description added for this category.'}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid #F1F4FA',
                fontSize: '13px'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#101A46' }}>
                <Package size={15} color={cat.color || '#405BFF'} />
                {cat.product_count} Products
              </span>

              <button
                onClick={() => navigate(`/products?category=${cat.id}`)}
                style={{
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: cat.color || '#405BFF',
                  cursor: 'pointer'
                }}
              >
                View Items &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? `Edit Category: ${selectedCategory?.name}` : 'Create New Category'}
        maxWidth="480px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formErrors.submit && (
            <div style={{ background: '#FFF1F0', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '13px' }}>
              {formErrors.submit}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Lab Equipment"
              required
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
            {formErrors.name && <span style={{ color: '#FF525C', fontSize: '11.5px', marginTop: '4px' }}>{formErrors.name}</span>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description of products grouped under this category..."
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

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '8px' }}>
              Accent Theme Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: c,
                    border: formData.color === c ? '3px solid #101A46' : '2px solid #FFFFFF',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${catToDelete?.name}"? Deletion will be rejected if any active products are currently assigned to this category.`}
        confirmText="Delete Category"
        isLoading={deleteLoading}
      />

      <NotificationToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default CategoriesPage;
