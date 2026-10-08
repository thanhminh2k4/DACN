// Tệp: frontend/src/components/Navbar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

export default function Navbar() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem('access_token');
    const role = sessionStorage.getItem('role');
    const fullName = sessionStorage.getItem('fullname') || sessionStorage.getItem('username') || 'Người dùng';
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/category?search=${searchQuery}`); 
        }
    };

    if (role === 'Admin' || role === 'Staff') {
        return (
            <nav className="main-navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                    <div className="nav-brand" onClick={() => navigate('/')}>
                        Studyholic <span style={{fontSize: '14px', color: '#666', fontWeight: 'normal'}}>| Quản Trị</span>
                    </div>
                    <div className="nav-item" onClick={() => navigate('/manage-products')}> Quản lý Sản phẩm</div>
                    <div className="nav-item" onClick={() => navigate('/manage-orders')}> Quản lý Đơn hàng</div>
                    {role === 'Admin' && (
                        <div className="nav-item" onClick={() => navigate('/manage-users')}> Quản lý Tài khoản</div>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span className="user-info"> {fullName}</span>
                    <button className="btn-logout" onClick={handleLogout}>Đăng xuất</button>
                </div>
            </nav>
        );
    }

    return (
        <nav className="main-navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="nav-brand" onClick={() => navigate('/')}>Studyholic</div>
                
                {/* Trỏ thẳng sang trang Category */}
                <div className="nav-item" style={{cursor: 'pointer'}} onClick={() => navigate('/category')}>
                    Danh mục 
                </div>
                <div className="nav-item" style={{cursor: 'pointer'}} onClick={() => navigate('/cart')}> Giỏ hàng</div>
                <div className="nav-item" style={{cursor: 'pointer'}} onClick={() => navigate('/order-history')}> Lịch sử </div>
            </div>

            <form className="nav-search" onSubmit={handleSearch} style={{ flex: '0 1 400px', display: 'flex', margin: '0 20px' }}>
                <input 
                    type="text" 
                    placeholder="Tìm kiếm dụng cụ học tập..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px 0 0 4px', border: '1px solid #ddd' }}
                />
                <button type="submit" style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '0 4px 4px 0', cursor: 'pointer' }}>
                    Tìm
                </button>
            </form>

            <div>
                {token ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span className="user-info"> {fullName}</span>
                        <button className="btn-logout" onClick={handleLogout}>Đăng xuất</button>
                    </div>
                ) : (
                    <button className="btn-login" onClick={() => navigate('/login')}>Đăng nhập</button>
                )}
            </div>
        </nav>
    );
}