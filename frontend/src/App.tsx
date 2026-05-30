import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import StudentDetails from './StudentDetails';
import { Header } from './Header';
import './index.css';

function App() {
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('isAdmin'));

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    setIsAdmin(false);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAdmin(!!localStorage.getItem('isAdmin'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <BrowserRouter>
      {isAdmin && <Header onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={isAdmin ? <Navigate to="/dashboard" /> : <Login onLogin={() => setIsAdmin(true)} />} />
        <Route path="/dashboard" element={isAdmin ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/student/:id" element={isAdmin ? <StudentDetails /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
