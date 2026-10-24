import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  Package,
  UserCheck
} from 'lucide-react';
import { supplierService } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import NotificationToast from '../components/NotificationToast';

export const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Form State
  const initialFormData = {
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  };
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await supplierService.getAll();
      if (res.success) {
        setSuppliers(res.suppliers || []);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedSupplier(null);
    setFormData(initialFormData);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setIsEditing(true);
    setSelectedSupplier(sup);
    setFormData({
      name: sup.name,
      contact_person: sup.contact_person || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.name.trim()) errors.name = 'Supplier name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await supplierService.update(selectedSupplier.id, formData);
        setToast({ type: 'success', message: `Supplier "${formData.name}" updated successfully.` });
      } else {
        await supplierService.create(formData);
        setToast({ type: 'success', message: `Supplier "${formData.name}" added successfully.` });
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      setFormErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await supplierService.delete(supplierToDelete.id);
      setToast({ type: 'success', message: res.message });
      setDeleteOpen(false);
      setSupplierToDelete(null);
      fetchSuppliers();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_person && s.contact_person.toLowerCase().includes(search.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#101A46', letterSpacing: '-0.4px' }}>
            Suppliers &amp; Vendors
          </h2>
          <p style={{ fontSize: '14px', color: '#727D9E', marginTop: '4px' }}>
            Manage supplier records, purchasing contacts, and catalog partnerships.
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="stock-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
          <Search size={18} color="#727D9E" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by name, email, or contact person..."
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

      {/* Suppliers Table */}
      <div className="stock-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Supplier / Vendor</th>
                <th>Contact Person</th>
                <th>Contact Info</th>
                <th>Address</th>
                <th>Linked Products</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#727D9E' }}>
                    Loading suppliers...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#727D9E' }}>
                    No suppliers found matching your query.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => (
                  <tr key={sup.id}>
                    <td style={{ paddingLeft: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#405BFF' }}>
                          <Truck size={20} strokeWidth={2.2} />
                        </div>
                        <div>
                          <span style={{ fontWeight: '700', color: '#101A46', display: 'block', fontSize: '14px' }}>
                            {sup.name}
                          </span>
                          <span style={{ fontSize: '11px', color: '#727D9E' }}>
                            Vendor ID: #{sup.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: '#101A46', fontWeight: '600' }}>
                        <UserCheck size={16} color="#727D9E" />
                        <span>{sup.contact_person || '—'}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px' }}>
                        {sup.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#405BFF' }}>
                            <Mail size={13} />
                            <span>{sup.email}</span>
                          </div>
                        )}
                        {sup.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#576282' }}>
                            <Phone size={13} />
                            <span>{sup.phone}</span>
                          </div>
                        )}
                        {!sup.email && !sup.phone && <span style={{ color: '#727D9E' }}>—</span>}
                      </div>
                    </td>

                    <td style={{ maxWidth: '250px', fontSize: '12.5px', color: '#576282' }}>
                      {sup.address ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} color="#727D9E" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sup.address}
                          </span>
                        </div>
                      ) : '—'}
                    </td>

                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F1F4FA', padding: '4px 12px', borderRadius: '9999px', fontSize: '12.5px', fontWeight: '700', color: '#101A46' }}>
                        <Package size={14} color="#727D9E" />
                        {sup.product_count} products
                      </span>
                    </td>

                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEdit(sup)}
                          style={{ padding: '6px', borderRadius: '8px', color: '#727D9E' }}
                          title="Edit Supplier"
                        >
                          <Edit2 size={17} />
                        </button>
                        <button
                          onClick={() => {
                            setSupplierToDelete(sup);
                            setDeleteOpen(true);
                          }}
                          style={{ padding: '6px', borderRadius: '8px', color: '#727D9E' }}
                          title="Delete Supplier"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? `Edit Supplier: ${selectedSupplier?.name}` : 'Add New Supplier'}
        maxWidth="520px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formErrors.submit && (
            <div style={{ background: '#FFF1F0', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '13px' }}>
              {formErrors.submit}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
              Supplier Company Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Nexus Components Ltd"
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
              Primary Contact Person
            </label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              placeholder="e.g. Kenji Sato"
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@company.com"
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: `1px solid ${formErrors.email ? '#FF525C' : '#E7ECF7'}`,
                  background: '#F9FAFF',
                  fontSize: '13.5px'
                }}
              />
              {formErrors.email && <span style={{ color: '#FF525C', fontSize: '11.5px', marginTop: '4px' }}>{formErrors.email}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 018-7201"
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
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
              Physical / Business Address
            </label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 88 Industrial Park, Sector 5, Austin, TX"
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
              {submitting ? 'Saving...' : isEditing ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Archive Confirmation */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${supplierToDelete?.name}"? If this supplier is linked to historical purchase orders, the action will be blocked to maintain audit integrity.`}
        confirmText="Delete Supplier"
        isLoading={deleteLoading}
      />

      <NotificationToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default SuppliersPage;
