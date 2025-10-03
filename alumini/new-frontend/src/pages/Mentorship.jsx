import { useEffect, useState } from 'react'
import apiUrl from '../utils/api'

export default function Mentorship() {
  const [requests, setRequests] = useState([])
  const [alumni, setAlumni] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [newRequest, setNewRequest] = useState({
    mentor_id: '',
    subject: '',
    message: ''
  })
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    Promise.all([
      fetch(apiUrl('/api/mentorship/')).then(r => r.json()).catch(() => []),
      fetch(apiUrl('/api/users/alumni')).then(r => r.json()).catch(() => [])
    ]).then(([mentorshipRequests, alumniList]) => {
      setRequests(mentorshipRequests)
      setAlumni(alumniList)
      setLoading(false)
    })
  }, [])

  const handleSubmitRequest = async (e) => {
    e.preventDefault()
    if (user.role !== 'student') {
      alert('Only students can request mentorship')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(apiUrl('/api/mentorship/request'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRequest)
      })

      if (response.ok) {
        alert('Mentorship request submitted successfully!')
        setShowRequestForm(false)
        setNewRequest({ mentor_id: '', subject: '', message: '' })
        // Refresh requests
        fetch(apiUrl('/api/mentorship/')).then(r => r.json()).then(setRequests)
      } else {
        const error = await response.json()
        alert('Error: ' + (error.error || 'Failed to submit request'))
      }
    } catch (err) {
      alert('Error submitting request: ' + err.message)
    }
  }

  const handleStatusUpdate = async (requestId, status) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/mentorship/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        alert(`Request ${status} successfully!`)
        // Refresh requests
        fetch(apiUrl('/api/mentorship/')).then(r => r.json()).then(setRequests)
      } else {
        const error = await response.json()
        alert('Error: ' + (error.error || 'Failed to update request'))
      }
    } catch (err) {
      alert('Error updating request: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          Loading mentorship data...
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card mb-3">
        <div className="card-header">
          <h2 className="card-title">Mentorship Program</h2>
          <p className="card-subtitle">
            Connect with experienced alumni for career guidance and professional development
          </p>
        </div>
        <div className="card-body">
          {user.role === 'student' && (
            <button 
              onClick={() => setShowRequestForm(!showRequestForm)}
              className="btn btn-primary"
            >
              {showRequestForm ? 'Cancel Request' : 'Request Mentorship'}
            </button>
          )}
        </div>
      </div>

      {/* Request Form */}
      {showRequestForm && user.role === 'student' && (
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">Submit Mentorship Request</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmitRequest}>
              <div className="form-group">
                <label className="form-label">Select Mentor</label>
                <select
                  value={newRequest.mentor_id}
                  onChange={(e) => setNewRequest({...newRequest, mentor_id: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Choose a mentor...</option>
                  {alumni.map(alumnus => (
                    <option key={alumnus.id} value={alumnus.id}>
                      {alumnus.name} - {alumnus.position} at {alumnus.company}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  value={newRequest.subject}
                  onChange={(e) => setNewRequest({...newRequest, subject: e.target.value})}
                  className="form-input"
                  placeholder="e.g., Career guidance in software engineering"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Message</label>
                <textarea
                  value={newRequest.message}
                  onChange={(e) => setNewRequest({...newRequest, message: e.target.value})}
                  className="form-input"
                  rows="4"
                  placeholder="Tell the mentor about yourself and what you hope to achieve..."
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Available Mentors */}
      <div className="card mb-3">
        <div className="card-header">
          <h3 className="card-title">Available Mentors</h3>
          <p className="card-subtitle">Experienced alumni ready to help you grow</p>
        </div>
        <div className="card-body">
          {alumni.length > 0 ? (
            <div className="grid grid-2">
              {alumni.map(mentor => (
                <div key={mentor.id} style={{
                  padding: '20px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: '#fafafa'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#0077b5' }}>{mentor.name}</h4>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                    {mentor.position} at {mentor.company}
                  </p>
                  <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
                    {mentor.bio}
                  </p>
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ fontSize: '12px', color: '#666' }}>Skills:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{mentor.skills}</p>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Graduated: {mentor.graduation_year} | Major: {mentor.major}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center" style={{ padding: '40px', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
              <p>No mentors available at the moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Mentorship Requests */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Mentorship Requests</h3>
          <p className="card-subtitle">
            {user.role === 'student' ? 'Your mentorship requests' : 'Requests from students'}
          </p>
        </div>
        <div className="card-body">
          {requests.length > 0 ? (
            requests.map(request => (
              <div key={request.id} style={{
                padding: '20px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                marginBottom: '16px',
                backgroundColor: '#fafafa'
              }}>
                <div className="d-flex justify-between align-center" style={{ marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#333' }}>
                      {request.student_name} → {request.mentor_name}
                    </h4>
                    <span className={`badge badge-${request.status === 'accepted' ? 'success' : request.status === 'pending' ? 'info' : 'secondary'}`}>
                      {request.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(request.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <p style={{ margin: '0 0 12px 0', color: '#333' }}>
                  <strong>Subject:</strong> {request.subject}
                </p>
                
                <p style={{ margin: '0 0 12px 0', color: '#333' }}>
                  <strong>Message:</strong> {request.message}
                </p>

                {user.role === 'alumni' && request.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleStatusUpdate(request.id, 'accepted')}
                      className="btn btn-success"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(request.id, 'rejected')}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center" style={{ padding: '40px', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤝</div>
              <p>No mentorship requests yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


