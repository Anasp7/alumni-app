import { useEffect, useState } from 'react'
import apiUrl from '../utils/api'

export default function Stories() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showStoryForm, setShowStoryForm] = useState(false)
  const [newStory, setNewStory] = useState({
    title: '',
    content: '',
    category: 'career'
  })
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetch(apiUrl('/api/stories'))
      .then(r => r.json())
      .then(setStories)
      .catch(() => setStories([]))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmitStory = async (e) => {
    e.preventDefault()
    if (user.role !== 'alumni') {
      alert('Only alumni can share success stories')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(apiUrl('/api/stories'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStory)
      })

      if (response.ok) {
        alert('Success story shared successfully!')
        setShowStoryForm(false)
        setNewStory({ title: '', content: '', category: 'career' })
        // Refresh stories
        fetch(apiUrl('/api/stories')).then(r => r.json()).then(setStories)
      } else {
        const error = await response.json()
        alert('Error: ' + (error.error || 'Failed to share story'))
      }
    } catch (err) {
      alert('Error sharing story: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          Loading success stories...
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card mb-3">
        <div className="card-header">
          <h2 className="card-title">Success Stories</h2>
          <p className="card-subtitle">
            Inspiring journeys and achievements from our alumni community
          </p>
        </div>
        <div className="card-body">
          {user.role === 'alumni' && (
            <button 
              onClick={() => setShowStoryForm(!showStoryForm)}
              className="btn btn-primary"
            >
              {showStoryForm ? 'Cancel' : 'Share Your Story'}
            </button>
          )}
        </div>
      </div>

      {/* Story Form */}
      {showStoryForm && user.role === 'alumni' && (
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">Share Your Success Story</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmitStory}>
              <div className="form-group">
                <label className="form-label">Story Title</label>
                <input
                  type="text"
                  value={newStory.title}
                  onChange={(e) => setNewStory({...newStory, title: e.target.value})}
                  className="form-input"
                  placeholder="e.g., From Student to Software Engineer at Google"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={newStory.category}
                  onChange={(e) => setNewStory({...newStory, category: e.target.value})}
                  className="form-input"
                >
                  <option value="career">Career Growth</option>
                  <option value="entrepreneurship">Entrepreneurship</option>
                  <option value="education">Education</option>
                  <option value="personal">Personal Development</option>
                  <option value="industry">Industry Insights</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Your Story</label>
                <textarea
                  value={newStory.content}
                  onChange={(e) => setNewStory({...newStory, content: e.target.value})}
                  className="form-input"
                  rows="8"
                  placeholder="Share your journey, challenges you overcame, lessons learned, and advice for current students..."
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Share Story
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stories List */}
      <div>
        {stories.length > 0 ? (
          stories.map(story => (
            <div key={story.id} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-between align-center" style={{ marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#0077b5' }}>{story.title}</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span className="badge badge-primary">{story.category}</span>
                      <span style={{ color: '#666', fontSize: '14px' }}>
                        By {story.author_name}
                      </span>
                      <span style={{ color: '#999', fontSize: '12px' }}>
                        {new Date(story.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  lineHeight: '1.6', 
                  color: '#333',
                  fontSize: '16px',
                  marginBottom: '20px'
                }}>
                  {story.content}
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <button className="btn btn-primary" style={{ fontSize: '14px', padding: '8px 16px' }}>
                    👍 Like
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize: '14px', padding: '8px 16px' }}>
                    💬 Comment
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize: '14px', padding: '8px 16px' }}>
                    🔗 Share
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <div className="card-body text-center" style={{ padding: '60px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📖</div>
              <h3 style={{ marginBottom: '12px', color: '#333' }}>No stories yet</h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Be the first to share your success story and inspire others!
              </p>
              {user.role === 'alumni' && (
                <button 
                  onClick={() => setShowStoryForm(true)}
                  className="btn btn-primary"
                >
                  Share Your Story
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


