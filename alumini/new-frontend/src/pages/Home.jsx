import { useEffect, useState } from 'react'

export default function Home() {
  const [status, setStatus] = useState('loading...')
  const [stats, setStats] = useState({})
  const [recentOpportunities, setRecentOpportunities] = useState([])
  const [recentStories, setRecentStories] = useState([])
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    // Check backend health
    fetch('/api/health').then(async (r) => {
      const j = await r.json().catch(() => ({}))
      setStatus(r.ok ? `ok (db: ${j.db || 'ok'})` : 'degraded')
    }).catch(() => setStatus('offline'))

    // Load dashboard data
    Promise.all([
      fetch('/api/opportunities').then(r => r.json()).catch(() => []),
      fetch('/api/stories').then(r => r.json()).catch(() => [])
    ]).then(([opportunities, stories]) => {
      setRecentOpportunities(opportunities.slice(0, 3))
      setRecentStories(stories.slice(0, 3))
      setStats({
        opportunities: opportunities.length,
        stories: stories.length
      })
    })
  }, [])

  return (
    <div className="container">
      {/* Welcome Section */}
      <div className="card mb-3">
        <div className="card-body">
          <h1 className="card-title">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="card-subtitle">
            {user.role === 'alumni' 
              ? 'Help students grow their careers and share your experience' 
              : 'Discover opportunities and connect with alumni mentors'
            }
          </p>
          <div className="d-flex align-center mt-2">
            <span className={`status-indicator ${status.includes('ok') ? 'status-online' : 'status-offline'}`}>
              <span>●</span>
              System {status.includes('ok') ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-3 mb-3">
        <div className="card">
          <div className="card-body text-center">
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💼</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#0a66c2' }}>{stats.opportunities || 0}</h3>
            <p style={{ margin: 0, color: '#666' }}>Job Opportunities</p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📖</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#057642' }}>{stats.stories || 0}</h3>
            <p style={{ margin: 0, color: '#666' }}>Success Stories</p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤝</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#8b5cf6' }}>12</h3>
            <p style={{ margin: 0, color: '#666' }}>Active Mentors</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-2">
        {/* Recent Opportunities */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Latest Opportunities</h3>
            <p className="card-subtitle">New job postings and internships</p>
          </div>
          <div className="card-body">
            {recentOpportunities.length > 0 ? (
              recentOpportunities.map(opp => (
                <div key={opp.id} style={{ 
                  padding: '16px', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px', 
                  marginBottom: '12px',
                  backgroundColor: '#fafafa'
                }}>
                  <div className="d-flex justify-between align-center">
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#333' }}>
                        {opp.title}
                      </h4>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#666' }}>
                        {opp.company}
                      </p>
                      <span className={`badge badge-${opp.type === 'internship' ? 'info' : 'primary'}`}>
                        {opp.type}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(opp.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center" style={{ padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
                <p>No opportunities available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Stories */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Success Stories</h3>
            <p className="card-subtitle">Inspiring journeys from our alumni</p>
          </div>
          <div className="card-body">
            {recentStories.length > 0 ? (
              recentStories.map(story => (
                <div key={story.id} style={{ 
                  padding: '16px', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px', 
                  marginBottom: '12px',
                  backgroundColor: '#fafafa'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333' }}>
                    {story.title}
                  </h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                    By {story.author_name}
                  </p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#888', lineHeight: '1.4' }}>
                    {story.content?.substring(0, 120)}...
                  </p>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(story.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center" style={{ padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
                <p>No stories shared yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mt-3">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
          <p className="card-subtitle">Get started with these common tasks</p>
        </div>
        <div className="card-body">
          <div className="d-flex" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => window.location.href = '/opportunities'}
              className="btn btn-primary"
            >
              💼 Browse Opportunities
            </button>
            <button 
              onClick={() => window.location.href = '/mentorship'}
              className="btn btn-success"
            >
              🤝 Find Mentors
            </button>
            <button 
              onClick={() => window.location.href = '/stories'}
              className="btn btn-secondary"
            >
              📖 Read Stories
            </button>
            {user.role === 'alumni' && (
              <button 
                onClick={() => window.location.href = '/opportunities'}
                className="btn btn-primary"
              >
                ➕ Post Opportunity
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


