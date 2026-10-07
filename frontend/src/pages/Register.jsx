import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/Auth.css';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp!');
            return;
        }

        try {
            await api.post('/users/register', {
                username: formData.username,
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
                role: 'Customer' 
            });
            
            setSuccess('Đăng ký thành công! Đang chuyển hướng đến đăng nhập...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại.');
        }
    };

    return (
        <div className="auth-container">
            <h2 className="auth-title">Đăng ký thành viên</h2>
            
            {error && <div className="alert-error">{error}</div>}
            {success && <div className="alert-success">{success}</div>}

            <form onSubmit={handleRegister}>
                <div className="form-group">
                    <label>Tên đăng nhập:</label>
                    <input type="text" name="username" className="form-control" 
                           value={formData.username} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Họ và tên:</label>
                    <input type="text" name="full_name" className="form-control" 
                           value={formData.full_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Email:</label>
                    <input type="email" name="email" className="form-control" 
                           value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Mật khẩu:</label>
                    <input type="password" name="password" className="form-control" 
                           value={formData.password} onChange={handleChange} required minLength="6" />
                </div>
                <div className="form-group">
                    <label>Xác nhận mật khẩu:</label>
                    <input type="password" name="confirmPassword" className="form-control" 
                           value={formData.confirmPassword} onChange={handleChange} required />
                </div>
                
                <button type="submit" className="btn-submit">Tạo tài khoản</button>
            </form>

            <div className="auth-footer">
                <p>Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link></p>
                <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>

                </p>
            </div>
        </div>
    );
}