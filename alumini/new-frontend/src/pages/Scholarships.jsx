import { useState, useEffect } from 'react';
import apiUrl from '../utils/api';

export default function Scholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    try {
      const response = await fetch(apiUrl('/api/scholarships'));
      
      if (response.ok) {
        const data = await response.json();
        setScholarships(data);
      } else {
        setError('Failed to load scholarships');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this scholarship?')) return;
    
    try {
      const response = await fetch(apiUrl(`/api/scholarships/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        fetchScholarships();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete scholarship');
      }
    } catch (err) {
      alert('Connection error');
    }
  };

  if (loading) {
    return <div className="loading">Loading scholarships...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Scholarships</h1>
          <p>Financial aid opportunities for students</p>
        </div>
        {user.role === 'alumni' && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create Scholarship
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="scholarships-grid">
        {scholarships.map(scholarship => (
          <ScholarshipCard
            key={scholarship.id}
            scholarship={scholarship}
            user={user}
            onDelete={handleDelete}
            onApply={() => {
              setSelectedScholarship(scholarship);
              setShowApplyModal(true);
            }}
            onEdit={() => {
              setSelectedScholarship(scholarship);
              setShowCreateModal(true);
            }}
          />
        ))}
      </div>

      {scholarships.length === 0 && (
        <div className="empty-state">
          <p>No scholarships available at the moment.</p>
        </div>
      )}

      {showCreateModal && (
        <ScholarshipFormModal
          scholarship={selectedScholarship}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedScholarship(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setSelectedScholarship(null);
            fetchScholarships();
          }}
        />
      )}

      {showApplyModal && selectedScholarship && (
        <ApplyModal
          scholarship={selectedScholarship}
          onClose={() => {
            setShowApplyModal(false);
            setSelectedScholarship(null);
          }}
          onSuccess={() => {
            setShowApplyModal(false);
            setSelectedScholarship(null);
            alert('Application submitted successfully!');
          }}
        />
      )}
    </div>
  );
}

function ScholarshipCard({ scholarship, user, onDelete, onApply, onEdit }) {
  const isOwner = user.role === 'alumni' && scholarship.posted_by === user.id;
  const canDelete = user.role === 'admin' || isOwner;
  const canApply = user.role === 'student' && scholarship.is_eligible;

  return (
    <div className="card scholarship-card">
      <div className="card-header">
        <h3>{scholarship.title}</h3>
        <div className="scholarship-amount">${scholarship.amount?.toLocaleString()}</div>
      </div>
      
      <div className="card-body">
        <p className="scholarship-description">{scholarship.description}</p>
        
        <div className="scholarship-details">
          <div className="detail-item">
            <span className="label">Deadline:</span>
            <span className="value">{new Date(scholarship.deadline).toLocaleDateString()}</span>
          </div>
          
          <div className="detail-item">
            <span className="label">Posted by:</span>
            <span className="value">{scholarship.posted_by_name}</span>
          </div>

          {scholarship.min_cgpa && (
            <div className="detail-item">
              <span className="label">Min CGPA Required:</span>
              <span className="value">{scholarship.min_cgpa}</span>
            </div>
          )}

          {scholarship.reservation_category && (
            <div className="detail-item">
              <span className="label">Category:</span>
              <span className="value">{scholarship.reservation_category}</span>
            </div>
          )}

          {scholarship.eligible_majors?.length > 0 && (
            <div className="detail-item">
              <span className="label">Eligible Majors:</span>
              <span className="value">{scholarship.eligible_majors.join(', ')}</span>
            </div>
          )}

          {scholarship.lateral_entry_allowed === false && (
            <div className="detail-item">
              <span className="label">⚠️ Lateral entry students not eligible</span>
            </div>
          )}
        </div>

        {user.role === 'student' && !scholarship.is_eligible && (
          <div className="eligibility-warning">
            ⚠️ You do not meet the eligibility criteria for this scholarship
          </div>
        )}
      </div>

      <div className="card-footer">
        {canApply && (
          <button className="btn btn-primary" onClick={onApply}>
            Apply Now
          </button>
        )}
        
        {isOwner && (
          <button className="btn btn-secondary" onClick={onEdit}>
            Edit
          </button>
        )}
        
        {canDelete && (
          <button className="btn btn-danger" onClick={() => onDelete(scholarship.id)}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function ScholarshipFormModal({ scholarship, onClose, onSuccess }) {
  const isEdit = !!scholarship;
  const [formData, setFormData] = useState({
    title: scholarship?.title || '',
    description: scholarship?.description || '',
    amount: scholarship?.amount || '',
    deadline: scholarship?.deadline || '',
    requirements: scholarship?.requirements || '',
    min_cgpa: scholarship?.min_cgpa || '',
    reservation_category: scholarship?.reservation_category || 'All',
    lateral_entry_allowed: scholarship?.lateral_entry_allowed ?? true,
    eligible_years: scholarship?.eligible_years || [],
    eligible_majors: scholarship?.eligible_majors || [],
    other_criteria: scholarship?.other_criteria || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEdit ? apiUrl(`/api/scholarships/${scholarship.id}`) : apiUrl('/api/scholarships');
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save scholarship');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleArrayInput = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData({ ...formData, [field]: items });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Scholarship' : 'Create Scholarship'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount ($) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Deadline *</label>
              <input
                type="date"
                className="form-input"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                required
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows="3"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Minimum CGPA Required</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                className="form-input"
                value={formData.min_cgpa}
                onChange={e => setFormData({ ...formData, min_cgpa: e.target.value })}
                placeholder="e.g., 7.5"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reservation Category</label>
              <select
                className="form-input"
                value={formData.reservation_category}
                onChange={e => setFormData({ ...formData, reservation_category: e.target.value })}
              >
                <option value="All">All Categories</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.lateral_entry_allowed}
                  onChange={e => setFormData({ ...formData, lateral_entry_allowed: e.target.checked })}
                />
                Allow Lateral Entry Students
              </label>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Eligible Years (comma-separated, e.g., 2024, 2025)</label>
              <input
                type="text"
                className="form-input"
                value={formData.eligible_years.join(', ')}
                onChange={e => handleArrayInput('eligible_years', e.target.value)}
                placeholder="2024, 2025, 2026"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Eligible Majors (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                value={formData.eligible_majors.join(', ')}
                onChange={e => handleArrayInput('eligible_majors', e.target.value)}
                placeholder="Computer Science, Business Administration"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Other Requirements</label>
              <textarea
                className="form-input"
                rows="3"
                value={formData.requirements}
                onChange={e => setFormData({ ...formData, requirements: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Additional Criteria</label>
              <textarea
                className="form-input"
                rows="2"
                value={formData.other_criteria}
                onChange={e => setFormData({ ...formData, other_criteria: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplyModal({ scholarship, onClose, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // In a real app, you would upload these to a file storage service
    // For now, we'll just store the file names
    setDocuments(files.map(f => ({ name: f.name, url: `uploads/${f.name}` })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/scholarships/${scholarship.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cover_letter: coverLetter,
          document_urls: documents.map(d => d.url)
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit application');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Apply for {scholarship.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label className="form-label">Cover Letter / Statement of Purpose</label>
            <textarea
              className="form-input"
              rows="6"
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              placeholder="Explain why you should be awarded this scholarship..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Supporting Documents (Transcripts, Certificates, etc.)</label>
            <input
              type="file"
              className="form-input"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            {documents.length > 0 && (
              <div className="file-list">
                {documents.map((doc, idx) => (
                  <div key={idx} className="file-item">📄 {doc.name}</div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
