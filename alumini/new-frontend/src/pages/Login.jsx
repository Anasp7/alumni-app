import { useState, useEffect } from 'react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking...');

  useEffect(() => {
    // Check backend health on component mount
    fetch('/api/health')
      .then(response => response.json())
      .then(data => {
        setBackendStatus(data.status === 'ok' ? 'online' : 'degraded');
      })
      .catch(() => {
        setBackendStatus('offline');
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Debug: Log response details
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setError('Invalid response from server');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">Alumni Connect</div>
          <div className="login-subtitle">Connect with your professional network</div>
          <div style={{ 
            fontSize: '12px', 
            color: backendStatus === 'online' ? '#28a745' : '#dc3545',
            marginTop: '8px'
          }}>
            Backend: {backendStatus}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              placeholder="alice@alumni.edu"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="demo-accounts">
          <div className="demo-title">Demo Accounts</div>
          <div className="demo-account">🛡️ Admin: admin@alumni.local / ChangeMe123!</div>
          <div className="demo-account">👨‍💼 Alumni: alice@alumni.edu / password123</div>
          <div className="demo-account">👨‍🎓 Student: sarah@student.edu / password123</div>
        </div>
      </div>
    </div>
  );
}
