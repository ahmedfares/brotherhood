import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import HomeIcon from '@material-ui/icons/Home';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import EmailIcon from '@material-ui/icons/Email';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Payments.css';
import './Household.css';

const emptyMemberForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  active: true
};

const Household = () => {
  const location = useLocation();
  const { user, setUser } = useContext(AuthContext);
  const inviteToken = useMemo(() => new URLSearchParams(location.search).get('invite') || '', [location.search]);
  const [activeTab, setActiveTab] = useState('details');
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [householdName, setHouseholdName] = useState('');
  const [savingHousehold, setSavingHousehold] = useState(false);
  const [householdError, setHouseholdError] = useState('');
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [memberErrors, setMemberErrors] = useState({});
  const [submittingMember, setSubmittingMember] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [invitingMemberId, setInvitingMemberId] = useState('');
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const [legacyImporting, setLegacyImporting] = useState(false);
  const [legacyImportMessage, setLegacyImportMessage] = useState('');

  const isOwner = user?.role === 'owner' || household?.currentUserRole === 'owner';
  const activeMembers = useMemo(() => members.filter(member => member.active !== false).length, [members]);

  const fetchHouseholdData = async () => {
    try {
      setLoading(true);
      const householdRes = await api.get('/household');
      if (householdRes.data.needsHouseholdSetup) {
        setHousehold({ needsHouseholdSetup: true });
        setMembers([]);
        return;
      }

      setHousehold(householdRes.data);
      setHouseholdName(householdRes.data.name || '');
      const membersRes = await api.get('/members');
      setMembers(membersRes.data || []);
    } catch (error) {
      console.error('Error fetching household data', error);
      setHouseholdError('Unable to load household data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholdData();
  }, []);

  const saveHousehold = async (event) => {
    event.preventDefault();
    setSavingHousehold(true);
    setHouseholdError('');

    try {
      let response;
      if (household?.needsHouseholdSetup) {
        response = await api.post('/household', { householdName });
        setUser({ ...user, householdId: response.data.householdId, role: response.data.role, memberId: response.data.memberId });
      } else {
        response = await api.put('/household', { householdName });
      }
      await fetchHouseholdData();
    } catch (error) {
      if (error.response?.data?.householdName) {
        setHouseholdError(error.response.data.householdName);
      } else {
        setHouseholdError('Unable to save household.');
      }
      console.error('Error saving household', error);
    } finally {
      setSavingHousehold(false);
    }
  };

  const acceptInvite = async () => {
    if (!inviteToken) return;
    setAcceptingInvite(true);
    setHouseholdError('');

    try {
      const response = await api.post('/member/invite/accept', { inviteToken });
      setUser({
        ...user,
        householdId: response.data.householdId,
        memberId: response.data.memberId,
        role: response.data.role
      });
      setInviteMessage(`Joined ${response.data.householdName || 'household'} successfully.`);
      window.history.replaceState(null, '', '/household');
      await fetchHouseholdData();
    } catch (error) {
      const message = error.response?.data?.email || error.response?.data?.inviteToken || error.response?.data?.error || 'Unable to accept invite.';
      setHouseholdError(message);
      console.error('Error accepting household invite', error);
    } finally {
      setAcceptingInvite(false);
    }
  };

  const resetMemberForm = () => {
    setMemberForm(emptyMemberForm);
    setMemberErrors({});
  };

  const openCreateMemberModal = () => {
    setEditingMember(null);
    resetMemberForm();
    setIsMemberModalOpen(true);
  };

  const openEditMemberModal = (member) => {
    setEditingMember(member);
    setMemberErrors({});
    setMemberForm({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      email: member.email || '',
      phoneNumber: member.phoneNumber || '',
      active: member.active !== false
    });
    setIsMemberModalOpen(true);
  };

  const closeMemberModal = () => {
    if (submittingMember) return;
    setIsMemberModalOpen(false);
    setEditingMember(null);
    resetMemberForm();
  };

  const handleMemberChange = (event) => {
    const { name, value, type, checked } = event.target;
    setMemberForm({
      ...memberForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const submitMember = async (event) => {
    event.preventDefault();
    setSubmittingMember(true);
    setMemberErrors({});
    setInviteMessage('');

    try {
      let response;
      if (editingMember) {
        response = await api.put(`/member/${editingMember.memberId}`, memberForm);
      } else {
        response = await api.post('/member', memberForm);
        const { inviteUrl, mailtoUrl, emailQueued, emailSent } = response.data || {};
        if (navigator.clipboard && inviteUrl) {
          navigator.clipboard.writeText(inviteUrl).catch(() => {});
        }
        if (!emailSent && !emailQueued && mailtoUrl) {
          window.location.href = mailtoUrl;
        }
        setInviteMessage(
          emailSent
            ? `Invite email sent to ${memberForm.email}.`
            : emailQueued
            ? `Invite email queued for ${memberForm.email}.`
            : `Invite link copied for ${memberForm.email}. Your email app can send it if direct email is not configured.`
        );
      }
      closeMemberModal();
      fetchHouseholdData();
    } catch (error) {
      if (error.response?.data) {
        setMemberErrors(error.response.data);
      }
      console.error('Error saving member', error);
    } finally {
      setSubmittingMember(false);
    }
  };

  const sendInvite = async (member) => {
    setInvitingMemberId(member.memberId);
    setInviteMessage('');

    try {
      const response = await api.post(`/member/${member.memberId}/invite`);
      const { inviteUrl, mailtoUrl, emailQueued, emailSent } = response.data;
      if (navigator.clipboard && inviteUrl) {
        navigator.clipboard.writeText(inviteUrl).catch(() => {});
      }
      if (!emailSent && !emailQueued && mailtoUrl) {
        window.location.href = mailtoUrl;
      }
      setInviteMessage(
        emailSent
          ? `Invite email sent to ${member.ownerName || member.email}.`
          : emailQueued
          ? `Invite email queued for ${member.ownerName || member.email}.`
          : `Invite link copied for ${member.ownerName || member.email}.`
      );
      fetchHouseholdData();
    } catch (error) {
      const message = error.response?.data?.email || error.response?.data?.error || 'Unable to create invite.';
      setInviteMessage(message);
      console.error('Error sending invite', error);
    } finally {
      setInvitingMemberId('');
    }
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
      await api.delete(`/member/${deleteTarget.memberId}`);
      setDeleteTarget(null);
      fetchHouseholdData();
    } catch (error) {
      console.error('Error deleting member', error);
    } finally {
      setDeleting(false);
    }
  };

  const importLegacyData = async () => {
    setLegacyImporting(true);
    setLegacyImportMessage('');

    try {
      const response = await api.post('/household/import-legacy');
      const counts = response.data.counts || {};
      setLegacyImportMessage(`Imported ${counts.transactions || 0} transactions, ${counts.categories || 0} categories, and ${counts.members || 0} legacy members.`);
      await fetchHouseholdData();
    } catch (error) {
      const message = error.response?.data?.error || 'Unable to import legacy data.';
      setLegacyImportMessage(message);
      console.error('Error importing legacy data', error);
    } finally {
      setLegacyImporting(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading Household...</div>;
  }

  return (
    <div className="household-page">
      <div className="household-tabs">
        <button className={activeTab === 'details' ? 'active' : ''} onClick={() => setActiveTab('details')}>
          Details
        </button>
        <button className={activeTab === 'members' ? 'active' : ''} onClick={() => setActiveTab('members')}>
          Members
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="household-details-grid">
          {inviteToken && household?.needsHouseholdSetup && (
            <div className="glass-panel household-card household-invite-card">
              <div className="household-card-header">
                <span className="household-icon"><EmailIcon /></span>
                <div>
                  <span className="household-kicker">Invite</span>
                  <h2 className="household-title">Join an existing household</h2>
                </div>
              </div>
              <p className="section-subtitle">Accept this invite to connect your existing account to the household.</p>
              {householdError && <div className="auth-error">{householdError}</div>}
              <button type="button" className="btn-primary household-save-btn" onClick={acceptInvite} disabled={acceptingInvite}>
                {acceptingInvite ? 'Joining...' : 'Accept Invite'}
              </button>
            </div>
          )}

          <div className="glass-panel household-card">
            <div className="household-card-header">
              <span className="household-icon"><HomeIcon /></span>
              <div>
                <span className="household-kicker">Household</span>
                <h2 className="household-title">{household?.needsHouseholdSetup ? 'Create your household' : household?.name}</h2>
              </div>
            </div>
            <form onSubmit={saveHousehold} className="household-form">
              <div className="form-group">
                <label className="form-label">Household Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={householdName}
                  onChange={(event) => setHouseholdName(event.target.value)}
                  disabled={!isOwner && !household?.needsHouseholdSetup}
                  required
                />
                {householdError && <div className="auth-error">{householdError}</div>}
              </div>
              {(isOwner || household?.needsHouseholdSetup) && (
                <button type="submit" className="btn-primary household-save-btn" disabled={savingHousehold}>
                  {savingHousehold ? 'Saving...' : household?.needsHouseholdSetup ? 'Create Household' : 'Save Household'}
                </button>
              )}
            </form>
          </div>

          <div className="glass-panel household-stats">
            <div>
              <span className="summary-label">Your role</span>
              <strong className="summary-value">{isOwner ? 'Main Householder' : 'Member'}</strong>
            </div>
            <div>
              <span className="summary-label">Active members</span>
              <strong className="summary-value">{activeMembers}</strong>
            </div>
          </div>

          {isOwner && !household?.needsHouseholdSetup && (
            <div className="glass-panel household-card legacy-import-card">
              <div className="household-card-header">
                <span className="household-icon"><HomeIcon /></span>
                <div>
                  <span className="household-kicker">Legacy data</span>
                  <h2 className="household-title">Import old transactions</h2>
                </div>
              </div>
              <p className="section-subtitle">
                Move the old global transactions, categories, and members into this household.
              </p>
              {household?.legacyDataMigratedAt && (
                <div className="household-inline-message">
                  Last imported {new Date(household.legacyDataMigratedAt).toLocaleString()}.
                </div>
              )}
              {legacyImportMessage && <div className="household-inline-message">{legacyImportMessage}</div>}
              <button type="button" className="btn-primary household-save-btn" onClick={importLegacyData} disabled={legacyImporting}>
                {legacyImporting ? 'Importing...' : 'Import Legacy Data'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="members-section">
          <div className="members-toolbar">
            <div>
              <h2 className="section-title">Household Members</h2>
              <p className="section-subtitle">Members can register from an invite, verify their email, and add their own transactions.</p>
            </div>
            {isOwner && (
              <button className="btn-primary new-payment-btn" onClick={openCreateMemberModal}>
                <PersonAddIcon fontSize="small" />
                New Member
              </button>
            )}
          </div>

          {inviteMessage && <div className="household-inline-message">{inviteMessage}</div>}

          <div className="member-grid">
            {members.map((member) => (
              <div key={member.memberId} className="glass-panel member-card">
                <div className="member-card-main">
                  <img
                    src={`https://ui-avatars.com/api/?name=${member.firstName || 'House'}+${member.lastName || 'Member'}&background=0e5968&color=f9fbf9`}
                    alt=""
                    className="member-avatar"
                  />
                  <div className="member-copy">
                    <span className="member-name">{member.ownerName}</span>
                    <span className="member-meta">{member.email || 'No email added'}</span>
                  </div>
                </div>
                <div className="member-card-footer">
                  <span className={`member-status ${member.active === false ? 'inactive' : ''}`}>
                    {member.active === false ? 'Inactive' : member.role === 'owner' ? 'Owner' : member.userId ? 'Registered' : 'Invite pending'}
                  </span>
                  {isOwner && (
                    <div className="table-actions">
                      {member.role !== 'owner' && !member.userId && (
                        <button
                          className="icon-action-btn invite"
                          onClick={() => sendInvite(member)}
                          aria-label="Send invite"
                          title="Send invite"
                          disabled={invitingMemberId === member.memberId}
                        >
                          <EmailIcon fontSize="small" />
                        </button>
                      )}
                      <button className="icon-action-btn edit" onClick={() => openEditMemberModal(member)} aria-label="Update member" title="Update member">
                        <EditIcon fontSize="small" />
                      </button>
                      <button className="icon-action-btn delete" onClick={() => setDeleteTarget(member)} aria-label="Delete member" title="Delete member">
                        <DeleteIcon fontSize="small" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {members.length === 0 && <div className="empty-chart">No members found.</div>}
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay confirm-overlay" role="presentation" onClick={closeDeleteConfirm}>
          <div className="glass-panel confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="member-delete-title" onClick={(event) => event.stopPropagation()}>
            <div className="confirm-icon">!</div>
            <div className="confirm-copy">
              <h3 id="member-delete-title" className="confirm-title">Delete member?</h3>
              <p className="confirm-text">This removes the member from future transaction selection. Existing transactions will remain.</p>
              <div className="confirm-summary">
                <span>{deleteTarget.ownerName || 'Member'}</span>
                <strong>{deleteTarget.role === 'owner' ? 'Owner' : 'Member'}</strong>
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

      {isMemberModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingMember ? 'Update Member' : 'Create a New Member'}</h3>
              <button className="modal-close" onClick={closeMemberModal}>&times;</button>
            </div>

            <form onSubmit={submitMember}>
              <div className="auth-form-grid">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" name="firstName" className="form-input" value={memberForm.firstName} onChange={handleMemberChange} required />
                  {memberErrors.firstName && <div className="auth-error">{memberErrors.firstName}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" name="lastName" className="form-input" value={memberForm.lastName} onChange={handleMemberChange} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-input" value={memberForm.email} onChange={handleMemberChange} required />
                {memberErrors.email && <div className="auth-error">{memberErrors.email}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" name="phoneNumber" className="form-input" value={memberForm.phoneNumber} onChange={handleMemberChange} pattern="^\\+?[0-9\\s().-]{7,20}$" />
                {memberErrors.phoneNumber && <div className="auth-error">{memberErrors.phoneNumber}</div>}
              </div>

              {editingMember && (
                <label className="member-active-toggle">
                  <input type="checkbox" name="active" checked={memberForm.active} onChange={handleMemberChange} />
                  <span>Active member</span>
                </label>
              )}

              {memberErrors.error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{memberErrors.error}</div>}

              <button type="submit" className="btn-primary" disabled={submittingMember}>
                {submittingMember ? 'Saving...' : editingMember ? 'Save Changes' : 'Create Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Household;
