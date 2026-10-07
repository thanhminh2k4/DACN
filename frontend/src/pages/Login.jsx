import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/Auth.css'; 

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/users/login', {
                username,
                password
            });
            
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('role', response.data.role);
            
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Tên đăng nhập hoặc mật khẩu không chính xác');
        }
    };

    return (
        <div className="auth-container">
            <h2 className="auth-title">Đăng nhập Studyholic</h2>
            
            {error && <div className="alert-error">{error}</div>}
            
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label>Tên đăng nhập:</label>
                    <input 
                        type="text" 
                        className="form-control"
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Mật khẩu:</label>
                    <input 
                        type="password" 
                        className="form-control"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit" className="btn-submit">
                    Đăng nhập
                </button>
            </form>

            <div className="auth-footer">
                <p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
            </div>
        </div>
    );
}