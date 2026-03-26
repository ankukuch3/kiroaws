import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Feed from './pages/Feed';
import CreatePost from './pages/CreatePost';
import ApiUrlDisplay from './components/ApiUrlDisplay';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// Layout component for authenticated pages
const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  
  return (
    <div className="layout">
      <header className="app-header">
        <h1><Link to="/">Micro Blogging</Link></h1>
        <nav>
          <ul>
            <li><Link to="/">Feed</Link></li>
            <li><Link to="/create">New Post</Link></li>
            <li><Link to={`/profile/${user?.id}`}>Profile</Link></li>
          </ul>
        </nav>
        <div className="user-info">
          <span>Welcome, {user?.displayName} {user?.followersCount !== undefined && `(${user.followersCount} followers)`}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Feed />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreatePost />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/:userId" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } 
            />
          </Routes>
          <ApiUrlDisplay />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;