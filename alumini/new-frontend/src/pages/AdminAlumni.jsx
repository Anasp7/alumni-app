import { useState, useEffect } from 'react'

export default function AdminAlumni() {
  const [alumni, setAlumni] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [kickingUserId, setKickingUserId] = useState(null)

  useEffect(() => {
    fetchAlumni()
  }, [])

  const fetchAlumni = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/alumni', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.msg || errorData.error || `Failed to fetch alumni (${response.status})`)
      }

      const data = await response.json()
      setAlumni(data)
      setLoading(false)
    } catch (err) {
      console.error('Fetch alumni error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleKickAlumni = async (alumniId, alumniName) => {
    if (!confirm(`Are you sure you want to KICK alumni ${alumniName}?\n\nThis will permanently delete:\n- Their account\n- All stories they authored\n- All opportunities they posted\n- All scholarships they posted\n- All mentorship sessions\n- All messages\n\nThis action CANNOT be undone!`)) {
      return
    }

    setKickingUserId(alumniId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${alumniId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to kick alumni')
      }

      const result = await response.json()
      alert(`✅ ${result.message}\n\nDeleted:\n- Stories: ${result.deleted.stories}\n- Opportunities: ${result.deleted.opportunities}\n- Scholarships: ${result.deleted.scholarships}\n- Mentorship Requests: ${result.deleted.mentorship_requests}\n- Messages: ${result.deleted.messages}`)
      
      // Refresh the alumni list
      fetchAlumni()
    } catch (err) {
      alert(`❌ Error: ${err.message}`)
    } finally {
      setKickingUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading alumni...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>👨‍💼 Alumni Management</h1>
        <p>Manage alumni accounts and contributions</p>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-label">Total Alumni:</span>
          <span className="stat-value">{alumni.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Opportunities:</span>
          <span className="stat-value">{alumni.reduce((sum, a) => sum + a.stats.opportunities, 0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Scholarships:</span>
          <span className="stat-value">{alumni.reduce((sum, a) => sum + a.stats.scholarships, 0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Stories:</span>
          <span className="stat-value">{alumni.reduce((sum, a) => sum + a.stats.stories, 0)}</span>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Position</th>
                <th>Major</th>
                <th>Grad Year</th>
                <th>Activity</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alumni.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    No alumni found
                  </td>
                </tr>
              ) : (
                alumni.map(person => (
                  <tr key={person.id}>
                    <td>{person.id}</td>
                    <td>
                      <div className="user-name">{person.name}</div>
                      {person.bio && <div className="user-bio">{person.bio.substring(0, 50)}...</div>}
                    </td>
                    <td>{person.email}</td>
                    <td>{person.company || '-'}</td>
                    <td>{person.position || '-'}</td>
                    <td>{person.major || '-'}</td>
                    <td>{person.graduation_year || '-'}</td>
                    <td>
                      <div className="activity-stats">
                        {person.stats.stories > 0 && <span title="Stories">📖 {person.stats.stories}</span>}
                        {person.stats.opportunities > 0 && <span title="Opportunities">💼 {person.stats.opportunities}</span>}
                        {person.stats.scholarships > 0 && <span title="Scholarships">💰 {person.stats.scholarships}</span>}
                        {person.stats.mentorships > 0 && <span title="Mentorships">🤝 {person.stats.mentorships}</span>}
                        {person.stats.messages > 0 && <span title="Messages">💬 {person.stats.messages}</span>}
                        {Object.values(person.stats).every(v => v === 0) && <span className="no-activity">None</span>}
                      </div>
                    </td>
                    <td>
                      {person.created_at ? new Date(person.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <button
                        className="btn-kick"
                        onClick={() => handleKickAlumni(person.id, person.name)}
                        disabled={kickingUserId === person.id}
                      >
                        {kickingUserId === person.id ? '⏳ Kicking...' : '🚫 Kick'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .stats-summary {
          display: flex;
          gap: 30px;
          margin-bottom: 20px;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
        }

        .table-container {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #dee2e6;
          font-size: 14px;
        }

        .admin-table td {
          padding: 12px;
          border-bottom: 1px solid #dee2e6;
          font-size: 14px;
        }

        .admin-table tbody tr:hover {
          background: #f8f9fa;
        }

        .user-name {
          font-weight: 600;
          color: #333;
        }

        .user-bio {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }

        .activity-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 12px;
        }

        .activity-stats span {
          background: #e9ecef;
          padding: 2px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }

        .no-activity {
          color: #999;
          font-style: italic;
        }

        .btn-kick {
          background: #dc3545;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: background 0.2s;
        }

        .btn-kick:hover:not(:disabled) {
          background: #c82333;
        }

        .btn-kick:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #666;
        }
      `}</style>
    </div>
  )
}
