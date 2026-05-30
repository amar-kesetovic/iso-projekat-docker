import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const rawBase = (import.meta.env.VITE_API_URL || "").trim();
      const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
      
      await axios.post(`${API_BASE}/login?username=${username}&password=${password}`);
      localStorage.setItem('isAdmin', 'true');
      onLogin();
      navigate('/dashboard');
    } catch (err) {
      console.error("Login request failed:", err);
      alert('Login failed. Ensure VITE_API_URL is correct during build.');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleLogin} className="p-8 border rounded shadow-md">
        <h1 className="text-2xl mb-4">Admin Login</h1>
        <input type="text" placeholder="Username" className="block border p-2 mb-2 w-full" onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" className="block border p-2 mb-2 w-full" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">Login</button>
      </form>
    </div>
  );
};

export default Login;
