import { useState, useEffect } from 'react'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [kickingUserId, setKickingUserId] = useState(null)

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const handleKickUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to KICK ${userName}?\n\nThis will permanently delete:\n- Their account\n- All stories they authored\n- All opportunities they posted\n- All scholarships they posted\n- All mentorship requests\n- All messages\n- All applications\n\nThis action CANNOT be undone!`)) {
      return
    }

    setKickingUserId(userId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to kick user')
      }

      const result = await response.json()
      alert(`✅ ${result.message}\n\nDeleted:\n- Stories: ${result.deleted.stories}\n- Opportunities: ${result.deleted.opportunities}\n- Scholarships: ${result.deleted.scholarships}\n- Mentorship Requests: ${result.deleted.mentorship_requests}\n- Messages: ${result.deleted.messages}\n- Applications: ${result.deleted.applications}`)
      
      // Refresh the user list
      fetchUsers()
      fetchStats()
    } catch (err) {
      alert(`❌ Error: ${err.message}`)
    } finally {
      setKickingUserId(null)
    }
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'badge-admin'
      case 'alumni': return 'badge-alumni'
      case 'student': return 'badge-student'
      default: return 'badge-default'
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading admin panel...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🛡️ Admin Panel</h1>
        <p>Manage users and platform content</p>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Platform Statistics */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">
              {Object.values(stats.users_by_role || {}).reduce((a, b) => a + b, 0)}
            </div>
            <div className="stat-breakdown">
              {stats.users_by_role && Object.entries(stats.users_by_role).map(([role, count]) => (
                <span key={role} className="stat-item">
                  {role}: {count}
                </span>
              ))}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Stories</div>
            <div className="stat-value">{stats.total_stories || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Opportunities</div>
            <div className="stat-value">{stats.total_opportunities || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Scholarships</div>
            <div className="stat-value">{stats.total_scholarships || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Mentorships</div>
            <div className="stat-value">{stats.total_mentorship_requests || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Messages</div>
            <div className="stat-value">{stats.total_messages || 0}</div>
          </div>
        </div>
      )}

      {/* User Management Table */}
      <div className="card">
        <div className="card-header">
          <h2>User Management</h2>
          <span className="user-count">{users.length} users</span>
        </div>
        
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Info</th>
                <th>Activity</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    <div className="user-name">{user.name}</div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className="user-info-cell">
                      {user.major && <div>📚 {user.major}</div>}
                      {user.company && <div>🏢 {user.company}</div>}
                      {user.position && <div>💼 {user.position}</div>}
                      {user.graduation_year && <div>🎓 {user.graduation_year}</div>}
                    </div>
                  </td>
                  <td>
                    <div className="activity-stats">
                      {user.stats.stories > 0 && <span title="Stories">📖 {user.stats.stories}</span>}
                      {user.stats.opportunities > 0 && <span title="Opportunities">💼 {user.stats.opportunities}</span>}
                      {user.stats.scholarships > 0 && <span title="Scholarships">💰 {user.stats.scholarships}</span>}
                      {user.stats.mentorships > 0 && <span title="Mentorships">🤝 {user.stats.mentorships}</span>}
                      {user.stats.messages > 0 && <span title="Messages">💬 {user.stats.messages}</span>}
                      {user.stats.applications > 0 && <span title="Applications">📝 {user.stats.applications}</span>}
                      {Object.values(user.stats).every(v => v === 0) && <span className="no-activity">No activity</span>}
                    </div>
                  </td>
                  <td>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    <button
                      className="btn-kick"
                      onClick={() => handleKickUser(user.id, user.name)}
                      disabled={kickingUserId === user.id}
                    >
                      {kickingUserId === user.id ? '⏳ Kicking...' : '🚫 Kick User'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }

        .stat-breakdown {
          margin-top: 8px;
          font-size: 12px;
          color: #888;
        }

        .stat-item {
          display: inline-block;
          margin-right: 12px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .user-count {
          background: #f0f0f0;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 14px;
          color: #666;
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

        .role-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge-admin {
          background: #dc3545;
          color: white;
        }

        .badge-alumni {
          background: #007bff;
          color: white;
        }

        .badge-student {
          background: #28a745;
          color: white;
        }

        .badge-default {
          background: #6c757d;
          color: white;
        }

        .user-info-cell {
          font-size: 12px;
          color: #666;
        }

        .user-info-cell > div {
          margin: 2px 0;
        }

        .activity-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
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
