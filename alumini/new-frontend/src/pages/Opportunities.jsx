import { useEffect, useState } from 'react'
import apiUrl from '../utils/api'

export default function Opportunities() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetch(apiUrl('/api/opportunities'))
      .then(r => r.json())
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true
    return item.type === filter
  })

  const handleApply = async (opportunityId) => {
    if (user.role !== 'student') {
      alert('Only students can apply for opportunities')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(apiUrl('/api/applications'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          opportunity_id: opportunityId,
          opportunity_type: 'job',
          cover_letter: 'I am interested in this opportunity and would like to apply.'
        })
      })

      if (response.ok) {
        alert('Application submitted successfully!')
      } else {
        const error = await response.json()
        alert('Error: ' + (error.error || 'Failed to submit application'))
      }
    } catch (err) {
      alert('Error submitting application: ' + err.message)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading opportunities...</div>
  }

  return (
    <div className="container">
      <div className="filter-controls">
        <h2 style={{ margin: 0, color: '#333' }}>Job & Internship Opportunities</h2>
        <div>
          <label style={{ marginRight: '10px', fontWeight: '500' }}>Filter by type:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Opportunities</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
          </select>
        </div>
      </div>

      <div>
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <div key={item.id} className="opportunity-card">
              <div className="opportunity-header">
                <div style={{ flex: 1 }}>
                  <h3 className="opportunity-title">{item.title}</h3>
                  <p className="opportunity-company">{item.company}</p>
                  <p className="opportunity-meta">
                    <strong>Type:</strong> {item.type} | 
                    <strong> Location:</strong> {item.location} | 
                    <strong> Posted:</strong> {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  <p className="opportunity-description">{item.description}</p>
                  <div className="opportunity-requirements">
                    <div className="requirements-title">Requirements:</div>
                    <ul className="requirements-list">
                      {item.requirements?.split(',').map((req, idx) => (
                        <li key={idx}>{req.trim()}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="opportunity-actions">
                  <div>
                    <div className="opportunity-type-badge">
                      {item.type}
                    </div>
                  </div>
                  {user.role === 'student' && (
                    <button 
                      onClick={() => handleApply(item.id)}
                      className="btn btn-primary"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <div className="card-body text-center" style={{ padding: '60px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>💼</div>
              <h3 style={{ marginBottom: '12px', color: '#333' }}>No opportunities found</h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                No opportunities match your current filter. Try adjusting your search criteria.
              </p>
              <button 
                onClick={() => setFilter('all')}
                className="btn btn-primary"
              >
                Show All Opportunities
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


