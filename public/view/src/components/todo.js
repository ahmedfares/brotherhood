import React, { useState, useEffect, useRef, useCallback } from 'react';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import api from '../services/api';
import './Payments.css';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [owners, setOwners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Infinite Scroll State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const observer = useRef();
  const requestIdRef = useRef(0);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const fetchDataRef = useRef(null);

  // Filter State
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonthPicker, setSelectedMonthPicker] = useState(defaultMonth);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    paymentBy: '',
    description: '',
    category: '',
    amount: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    pageRef.current = page;
    loadingRef.current = loading;
    loadingMoreRef.current = loadingMore;
    hasMoreRef.current = hasMore;
  }, [page, loading, loadingMore, hasMore]);

  const loadNextPage = useCallback(() => {
    if (loadingRef.current || loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setPage(pageRef.current + 1);
  }, []);

  // Sentinel ref for infinite scroll
  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadNextPage();
      }
    }, { root: null, rootMargin: '360px 0px', threshold: 0.01 });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadNextPage]);

  const selectedYear = selectedMonthPicker ? selectedMonthPicker.split('-')[0] : 'All';
  const selectedMonth = selectedMonthPicker ? (parseInt(selectedMonthPicker.split('-')[1], 10) - 1).toString() : 'All';

  const fetchReferences = useCallback(async () => {
    try {
      const [ownersRes, categoriesRes] = await Promise.all([
        api.get('/owners'),
        api.get('/collections')
      ]);
      setOwners(ownersRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching payment reference data', error);
    }
  }, []);

  const fetchData = useCallback(async (pageNum, isInitial = false) => {
    const requestId = ++requestIdRef.current;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const yearParam = selectedYear !== 'All' ? `&year=${selectedYear}` : '';
      const monthParam = selectedMonth !== 'All' ? `&month=${selectedMonth}` : '';
      const catParam = selectedCategory !== 'All' ? `&category=${selectedCategory}` : '';
      
      const paymentsRes = await api.get(`/payments?page=${pageNum}&limit=${limit}${yearParam}${monthParam}${catParam}`);
      if (requestId !== requestIdRef.current) return;
      
      if (paymentsRes.data.status === 'success') {
        const newPayments = paymentsRes.data.data;
        setPayments(prev => isInitial ? newPayments : [...prev, ...newPayments]);
        setHasMore(Boolean(paymentsRes.data.pagination.hasMore));
      }
    } catch (error) {
      console.error('Error fetching payments data', error);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [selectedYear, selectedMonth, selectedCategory]);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchReferences();
  }, [fetchReferences]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const fullHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight
        );

        if (fullHeight - (scrollTop + viewportHeight) < 520) {
          loadNextPage();
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchend', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchend', handleScroll);
    };
  }, [loadNextPage]);

  // Reload when filters change
  useEffect(() => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    loadingMoreRef.current = false;
    setPage(1);
    setPayments([]);
    setHasMore(true);
    setLoadingMore(false);
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
    fetchData(1, true);
  }, [fetchData]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchDataRef.current(page);
    }
  }, [page]);

  const openDeleteConfirm = (payment) => {
    setDeleteTarget(payment);
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
      await api.delete(`/payment/${deleteTarget.paymentId}`);
      setDeleteTarget(null);
      // Reset and refresh to first page to avoid index mismatches
      setPage(1);
      fetchData(1, true);
    } catch (error) {
      console.error('Error deleting transaction', error);
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({ paymentBy: '', description: '', category: '', amount: '' });
    setFormErrors({});
  };

  const openCreateModal = () => {
    setEditingPayment(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (payment) => {
    setEditingPayment(payment);
    setFormErrors({});
    setFormData({
      paymentBy: String(payment.TransactionBy || ''),
      description: payment.Description || '',
      category: String(payment.Category || ''),
      amount: payment.Amount !== undefined && payment.Amount !== null ? String(payment.Amount) : ''
    });
    setIsModalOpen(true);
  };

  const closeTransactionModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditingPayment(null);
    resetForm();
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    
    const userPayment = {
      TransactionBy: formData.paymentBy,
      Category: formData.category,
      Description: formData.description,
      Amount: formData.amount
    };

    try {
      if (editingPayment) {
        await api.put(`/payment/${editingPayment.paymentId}`, userPayment);
      } else {
        await api.post('/payment', userPayment);
      }
      setIsModalOpen(false);
      setEditingPayment(null);
      resetForm();
      setPage(1);
      fetchData(1, true);
    } catch (error) {
      if (error.response && error.response.data) {
        setFormErrors(error.response.data);
      }
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && page === 1) {
    return <div className="loading-container">Loading Transactions...</div>;
  }

  return (
    <div>
      <div className="payments-header">
        <button className="btn-primary new-payment-btn" onClick={openCreateModal}>
          + New Transaction
        </button>
      </div>

      <div className="glass-panel payments-filter-bar">
        <div className="filter-item">
          <label>Month</label>
          <input
            type="month"
            className="filter-control"
            value={selectedMonthPicker}
            onChange={(e) => setSelectedMonthPicker(e.target.value)}
          />
        </div>

        <div className="filter-item">
          <label>Category</label>
          <select className="filter-control" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat.collectionId} value={cat.collectionId}>{cat.collectionName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mobile-cards">
        {payments.map((payment) => {
          const ownerName = owners.find(x => String(x.ownerId) === String(payment.TransactionBy))?.ownerName || 'Unknown';
          const catName = categories.find(x => String(x.collectionId) === String(payment.Category))?.collectionName || 'Unknown';
          const dateStr = new Date(payment.TransactionDate).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
          
          return (
            <div key={payment.paymentId} className="glass-panel transaction-card">
              <div className="card-topline">
                <div className="card-main">
                  <span className="card-title">{payment.Description}</span>
                  <span className="card-date">{dateStr}</span>
                </div>
                <span className="card-amount">${Number(payment.Amount).toFixed(2)}</span>
              </div>
              <div className="card-meta">
                <span className="card-badge">{catName}</span>
                <span className="card-badge" style={{ background: 'rgba(14, 89, 104, 0.28)', color: '#c8d6d2' }}>{ownerName}</span>
                <div className="card-actions">
                  <button className="icon-action-btn edit" onClick={() => openEditModal(payment)} aria-label="Update transaction" title="Update transaction">
                    <EditIcon fontSize="small" />
                  </button>
                  <button className="icon-action-btn delete" onClick={() => openDeleteConfirm(payment)} aria-label="Delete transaction" title="Delete transaction">
                    <DeleteIcon fontSize="small" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Action Taker</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const ownerName = owners.find(x => String(x.ownerId) === String(payment.TransactionBy))?.ownerName || 'Unknown';
              const catName = categories.find(x => String(x.collectionId) === String(payment.Category))?.collectionName || 'Unknown';
              return (
                <tr key={payment.paymentId}>
                  <td>{new Date(payment.TransactionDate).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td>{ownerName}</td>
                  <td>{payment.Description}</td>
                  <td><span className="badge">{catName}</span></td>
                  <td className="amount-cell">${Number(payment.Amount).toFixed(2)}</td>
                  <td className="table-actions">
                    <button className="icon-action-btn edit" onClick={() => openEditModal(payment)} aria-label="Update transaction" title="Update transaction">
                      <EditIcon fontSize="small" />
                    </button>
                    <button className="icon-action-btn delete" onClick={() => openDeleteConfirm(payment)} aria-label="Delete transaction" title="Delete transaction">
                      <DeleteIcon fontSize="small" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dedicated Scroll Sentinel */}
      <div ref={lastElementRef} style={{ height: '10px' }}></div>

      {/* Infinite Scroll Feedback */}
      {loadingMore && <div className="infinite-loader">Loading more transactions...</div>}
      {!hasMore && payments.length > 0 && <div className="end-message">You've reached the end of your transactions.</div>}
      {payments.length === 0 && !loading && <div className="empty-chart">No transactions found.</div>}

      {deleteTarget && (
        <div className="modal-overlay confirm-overlay" role="presentation" onClick={closeDeleteConfirm}>
          <div className="glass-panel confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">!</div>
            <div className="confirm-copy">
              <h3 id="delete-confirm-title" className="confirm-title">Delete transaction?</h3>
              <p className="confirm-text">
                This will permanently remove this transaction from your records.
              </p>
              <div className="confirm-summary">
                <span>{deleteTarget.Description || 'Transaction'}</span>
                <strong>${Number(deleteTarget.Amount).toFixed(2)}</strong>
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
              <h3 className="modal-title">{editingPayment ? 'Update Transaction' : 'Create a New Transaction'}</h3>
              <button className="modal-close" onClick={closeTransactionModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Transaction By</label>
                <select 
                  name="paymentBy" 
                  className="form-select" 
                  value={formData.paymentBy} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="" disabled>Select Owner</option>
                  {owners.map(owner => (
                    <option key={owner.ownerId} value={owner.ownerId}>{owner.ownerName}</option>
                  ))}
                </select>
                {formErrors.paymentBy && <div className="auth-error">{formErrors.paymentBy}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text" 
                  name="description" 
                  className="form-input" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  required 
                />
                {formErrors.description && <div className="auth-error">{formErrors.description}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  name="category" 
                  className="form-select" 
                  value={formData.category} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="" disabled>Select a Category</option>
                  {categories.map(cat => (
                    <option key={cat.collectionId} value={cat.collectionId}>{cat.collectionName}</option>
                  ))}
                </select>
                {formErrors.category && <div className="auth-error">{formErrors.category}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Amount</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="amount" 
                  className="form-input" 
                  value={formData.amount} 
                  onChange={handleInputChange} 
                  required 
                />
                {formErrors.amount && <div className="auth-error">{formErrors.amount}</div>}
              </div>

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingPayment ? 'Save Changes' : 'Submit Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Payments;
