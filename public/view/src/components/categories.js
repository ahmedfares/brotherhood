import React, { useEffect, useMemo, useState } from 'react';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import CategoryIcon from '@material-ui/icons/Category';
import api from '../services/api';
import './Payments.css';
import './Categories.css';

const emptyForm = {
  collectionName: '',
  expectedValue: ''
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const totalExpected = useMemo(() => {
    return categories.reduce((sum, category) => sum + Number(category.expectedValue || 0), 0);
  }, [categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/collections');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData(emptyForm);
    setFormErrors({});
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormErrors({});
    setFormData({
      collectionName: category.collectionName || '',
      expectedValue: category.expectedValue !== undefined && category.expectedValue !== null
        ? String(category.expectedValue)
        : ''
    });
    setIsModalOpen(true);
  };

  const closeCategoryModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditingCategory(null);
    resetForm();
  };

  const handleInputChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    const payload = {
      collectionName: formData.collectionName,
      expectedValue: formData.expectedValue
    };

    try {
      if (editingCategory) {
        await api.put(`/collection/${editingCategory.collectionId}`, payload);
      } else {
        await api.post('/collection', payload);
      }
      closeCategoryModal();
      fetchCategories();
    } catch (error) {
      if (error.response && error.response.data) {
        setFormErrors(error.response.data);
      }
      console.error('Error saving category', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (category) => {
    setDeleteTarget(category);
  };

  const closeDeleteConfirm = () => {
    if (!deleting) {
      setDeleteTarget(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await api.delete(`/collection/${deleteTarget.collectionId}`);
      setDeleteTarget(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading && categories.length === 0) {
    return <div className="loading-container">Loading Categories...</div>;
  }

  return (
    <div className="categories-page">
      <div className="categories-toolbar">
        <div className="categories-summary glass-panel">
          <div className="summary-icon">
            <CategoryIcon />
          </div>
          <div>
            <span className="summary-label">Monthly expected total</span>
            <strong className="summary-value">${totalExpected.toFixed(2)}</strong>
          </div>
        </div>
        <button className="btn-primary new-payment-btn" onClick={openCreateModal}>
          + New Category
        </button>
      </div>

      <div className="category-grid">
        {categories.map((category) => (
          <div key={category.collectionId} className="glass-panel category-card">
            <div className="category-card-main">
              <div className="category-mark">
                <CategoryIcon />
              </div>
              <div className="category-copy">
                <span className="category-name">{category.collectionName}</span>
                <span className="category-meta">Monthly expected</span>
              </div>
            </div>
            <div className="category-card-footer">
              <strong className="category-amount">${Number(category.expectedValue || 0).toFixed(2)}</strong>
              <div className="table-actions">
                <button className="icon-action-btn edit" onClick={() => openEditModal(category)} aria-label="Update category" title="Update category">
                  <EditIcon fontSize="small" />
                </button>
                <button className="icon-action-btn delete" onClick={() => openDeleteConfirm(category)} aria-label="Delete category" title="Delete category">
                  <DeleteIcon fontSize="small" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && !loading && (
        <div className="empty-chart">No categories found.</div>
      )}

      {deleteTarget && (
        <div className="modal-overlay confirm-overlay" role="presentation" onClick={closeDeleteConfirm}>
          <div className="glass-panel confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="category-delete-title" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">!</div>
            <div className="confirm-copy">
              <h3 id="category-delete-title" className="confirm-title">Delete category?</h3>
              <p className="confirm-text">
                Existing transactions in this category will remain, but they may show as Unknown after deletion.
              </p>
              <div className="confirm-summary">
                <span>{deleteTarget.collectionName || 'Category'}</span>
                <strong>${Number(deleteTarget.expectedValue || 0).toFixed(2)}</strong>
              </div>
            </div>
            <div className="confirm-actions">
              <button type="button" className="btn-secondary confirm-cancel" onClick={closeDeleteConfirm} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="btn-danger confirm-delete" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingCategory ? 'Update Category' : 'Create a New Category'}</h3>
              <button className="modal-close" onClick={closeCategoryModal}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  name="collectionName"
                  className="form-input"
                  value={formData.collectionName}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.collectionName && <div className="auth-error">{formErrors.collectionName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Monthly Expected Value</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="expectedValue"
                  className="form-input"
                  value={formData.expectedValue}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.expectedValue && <div className="auth-error">{formErrors.expectedValue}</div>}
              </div>

              {formErrors.error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{formErrors.error}</div>}

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
