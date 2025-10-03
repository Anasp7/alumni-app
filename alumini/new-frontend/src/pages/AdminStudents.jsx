import { useState, useEffect } from 'react'

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [kickingUserId, setKickingUserId] = useState(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.msg || errorData.error || `Failed to fetch students (${response.status})`)
      }

      const data = await response.json()
      setStudents(data)
      setLoading(false)
    } catch (err) {
      console.error('Fetch students error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleKickStudent = async (studentId, studentName) => {
    if (!confirm(`Are you sure you want to KICK student ${studentName}?\n\nThis will permanently delete:\n- Their account\n- All stories they authored\n- All mentorship requests\n- All messages\n- All applications\n\nThis action CANNOT be undone!`)) {
      return
    }

    setKickingUserId(studentId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to kick student')
      }

      const result = await response.json()
      alert(`✅ ${result.message}\n\nDeleted:\n- Stories: ${result.deleted.stories}\n- Mentorship Requests: ${result.deleted.mentorship_requests}\n- Messages: ${result.deleted.messages}\n- Applications: ${result.deleted.applications}`)
      
      // Refresh the student list
      fetchStudents()
    } catch (err) {
      alert(`❌ Error: ${err.message}`)
    } finally {
      setKickingUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading students...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>👨‍🎓 Student Management</h1>
        <p>Manage student accounts and activity</p>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-label">Total Students:</span>
          <span className="stat-value">{students.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Stories:</span>
          <span className="stat-value">{students.reduce((sum, s) => sum + s.stats.stories, 0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Applications:</span>
          <span className="stat-value">{students.reduce((sum, s) => sum + s.stats.applications, 0)}</span>
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
                <th>Major</th>
                <th>Grad Year</th>
                <th>Skills</th>
                <th>Activity</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    No students found
                  </td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>
                      <div className="user-name">{student.name}</div>
                      {student.bio && <div className="user-bio">{student.bio.substring(0, 50)}...</div>}
                    </td>
                    <td>{student.email}</td>
                    <td>{student.major || '-'}</td>
                    <td>{student.graduation_year || '-'}</td>
                    <td>
                      <div className="skills-cell">
                        {student.skills ? student.skills.substring(0, 40) + '...' : '-'}
                      </div>
                    </td>
                    <td>
                      <div className="activity-stats">
                        {student.stats.stories > 0 && <span title="Stories">📖 {student.stats.stories}</span>}
                        {student.stats.mentorships > 0 && <span title="Mentorships">🤝 {student.stats.mentorships}</span>}
                        {student.stats.messages > 0 && <span title="Messages">💬 {student.stats.messages}</span>}
                        {student.stats.applications > 0 && <span title="Applications">📝 {student.stats.applications}</span>}
                        {Object.values(student.stats).every(v => v === 0) && <span className="no-activity">None</span>}
                      </div>
                    </td>
                    <td>
                      {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <button
                        className="btn-kick"
                        onClick={() => handleKickStudent(student.id, student.name)}
                        disabled={kickingUserId === student.id}
                      >
                        {kickingUserId === student.id ? '⏳ Kicking...' : '🚫 Kick'}
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
          color: #28a745;
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

        .skills-cell {
          font-size: 12px;
          color: #666;
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
