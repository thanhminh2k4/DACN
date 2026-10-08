// Tệp: frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Profile() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem('access_token');
    const role = sessionStorage.getItem('role');

    // Chế độ hiển thị cột phải: 'view' (chỉ xem), 'edit_info' (sửa thông tin), 'edit_password' (đổi pass)
    const [mode, setMode] = useState('view'); 
    
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // State Thông tin
    const [profile, setProfile] = useState({
        fullname: '',
        phone: '',
        email: '',
        address: '',
        avatar_url: '',
        custom_id: '',
        username: ''
    });

    // State Mật khẩu
    const [passwords, setPasswords] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchProfile();
    }, [token, navigate]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/me');
            setProfile(res.data);
        } catch (error) {
            console.error("Lỗi lấy thông tin:", error);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        if (type === 'error') setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            await api.put('/users/update-profile', profile);
            showMessage('success', 'Cập nhật thông tin thành công!');
            
            if(profile.fullname) sessionStorage.setItem('fullname', profile.fullname);
            
            // Cập nhật xong tự quay về màn hình Xem
            setTimeout(() => setMode('view'), 1500); 
        } catch (error) {
            showMessage('error', 'Cập nhật thất bại. Vui lòng thử lại.');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwords.new_password !== passwords.confirm_password) {
            showMessage('error', 'Mật khẩu xác nhận không khớp!');
            return;
        }

        try {
            await api.put('/users/change-password', {
                old_password: passwords.old_password,
                new_password: passwords.new_password
            });
            showMessage('success', 'Đổi mật khẩu thành công!');
            setPasswords({ old_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => setMode('view'), 1500);
        } catch (error) {
            showMessage('error', error.response?.data?.detail || 'Mật khẩu cũ không chính xác.');
        }
    };

    if (loading) return <div style={{textAlign:'center', padding: '50px'}}>Đang tải dữ liệu...</div>;

    const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '15px', outline: 'none' };
    const labelStyle = { fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px' };
    const textDataStyle = { padding: '10px 12px', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #eee', color: '#333', minHeight: '40px' };

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', fontFamily: 'Arial' }}>
            <h2 style={{ marginBottom: '25px', color: '#333' }}>Hồ sơ Cá nhân</h2>

            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                
                {/* ================= CỘT TRÁI: ẢNH & THÔNG TIN CHUNG ================= */}
                <div style={{ flex: '0 0 30%', background: '#fff', padding: '30px 20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" style={{ width: '160px', height: '160px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #f1f1f1' }} />
                        ) : (
                            <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: '#0275d8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '50px', fontWeight: 'bold', border: '4px solid #f1f1f1' }}>
                                {profile.username?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '22px', color: '#333' }}>
                        {profile.fullname || 'Người dùng'}
                    </h3>
                    
                    <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '8px', marginBottom: '8px' }}>
                            <span>Tên đăng nhập:</span> <strong>{profile.username}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '8px', marginBottom: '8px' }}>
                            <span>ID Hệ thống:</span> <strong>{profile.custom_id}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Vai trò:</span> 
                            <span style={{ 
                                background: role === 'Admin' ? '#dc3545' : role === 'Staff' ? '#ffc107' : '#28a745', 
                                color: role === 'Staff' ? '#000' : '#fff', 
                                padding: '3px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' 
                            }}>
                                {role}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ================= CỘT PHẢI: CHI TIẾT & CHỈNH SỬA ================= */}
                <div style={{ flex: '1', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    
                    <h3 style={{ margin: '0 0 25px 0', borderBottom: '2px solid #eee', paddingBottom: '15px', color: '#333' }}>
                        {mode === 'view' ? 'Chi tiết Thông tin' : mode === 'edit_info' ? 'Chỉnh sửa Thông tin' : 'Đổi Mật khẩu'}
                    </h3>

                    {/* THÔNG BÁO MƯỢT MÀ */}
                    {message.text && (
                        <div style={{ padding: '12px 15px', marginBottom: '20px', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px', background: message.type === 'error' ? '#f8d7da' : '#d4edda', color: message.type === 'error' ? '#721c24' : '#155724' }}>
                            {message.text}
                        </div>
                    )}

                    {/* 1. MÀN HÌNH CHỈ XEM */}
                    {mode === 'view' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                <div>
                                    <label style={labelStyle}>Họ và tên:</label>
                                    <div style={textDataStyle}>{profile.fullname || <span style={{color: '#aaa'}}>Chưa cập nhật</span>}</div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Số điện thoại:</label>
                                    <div style={textDataStyle}>{profile.phone || <span style={{color: '#aaa'}}>Chưa cập nhật</span>}</div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Email:</label>
                                    <div style={textDataStyle}>{profile.email || <span style={{color: '#aaa'}}>Chưa cập nhật</span>}</div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Địa chỉ liên hệ:</label>
                                    <div style={textDataStyle}>{profile.address || <span style={{color: '#aaa'}}>Chưa cập nhật</span>}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid #eee', paddingTop: '25px' }}>
                                <button 
                                    onClick={() => { setMode('edit_info'); setMessage({type:'', text:''}); }}
                                    style={{ padding: '10px 20px', background: '#0275d8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Thay đổi thông tin
                                </button>
                                <button 
                                    onClick={() => { setMode('edit_password'); setMessage({type:'', text:''}); setPasswords({old_password:'', new_password:'', confirm_password:''}); }}
                                    style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Thay đổi mật khẩu
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2. MÀN HÌNH CHỈNH SỬA THÔNG TIN */}
                    {mode === 'edit_info' && (
                        <form onSubmit={handleUpdateProfile}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                                <div>
                                    <label style={labelStyle}>Họ và tên:</label>
                                    <input style={inputStyle} type="text" value={profile.fullname} onChange={e => setProfile({...profile, fullname: e.target.value})} placeholder="Nhập họ và tên..." />
                                </div>
                                <div>
                                    <label style={labelStyle}>Số điện thoại:</label>
                                    <input style={inputStyle} type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="Nhập số điện thoại..." />
                                </div>
                                <div>
                                    <label style={labelStyle}>Email:</label>
                                    <input style={inputStyle} type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} placeholder="Nhập địa chỉ email..." />
                                </div>
                                <div>
                                    <label style={labelStyle}>Ảnh đại diện (URL):</label>
                                    <input style={inputStyle} type="text" value={profile.avatar_url} onChange={e => setProfile({...profile, avatar_url: e.target.value})} placeholder="Nhập link ảnh (https://...)" />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Địa chỉ liên hệ:</label>
                                <textarea style={{...inputStyle, resize: 'vertical'}} rows="2" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} placeholder="Nhập địa chỉ chi tiết..."></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                <button type="submit" disabled={message.type === 'success'} style={{ padding: '10px 25px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: message.type === 'success' ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                                    Lưu thay đổi
                                </button>
                                <button type="button" onClick={() => { setMode('view'); fetchProfile(); }} style={{ padding: '10px 25px', background: '#e9ecef', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Hủy bỏ
                                </button>
                            </div>
                        </form>
                    )}

                    {/* 3. MÀN HÌNH ĐỔI MẬT KHẨU */}
                    {mode === 'edit_password' && (
                        <form onSubmit={handleChangePassword} style={{ maxWidth: '400px' }}>
                            <label style={labelStyle}>Mật khẩu hiện tại:</label>
                            <input style={inputStyle} type="password" required value={passwords.old_password} onChange={e => setPasswords({...passwords, old_password: e.target.value})} placeholder="Nhập mật khẩu cũ..." />

                            <label style={labelStyle}>Mật khẩu mới:</label>
                            <input style={inputStyle} type="password" required value={passwords.new_password} onChange={e => setPasswords({...passwords, new_password: e.target.value})} placeholder="Nhập mật khẩu mới..." />

                            <label style={labelStyle}>Xác nhận mật khẩu mới:</label>
                            <input style={inputStyle} type="password" required value={passwords.confirm_password} onChange={e => setPasswords({...passwords, confirm_password: e.target.value})} placeholder="Nhập lại mật khẩu mới..." />

                            <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                                <button type="submit" disabled={message.type === 'success'} style={{ padding: '10px 25px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: '4px', cursor: message.type === 'success' ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                                    Xác nhận Đổi
                                </button>
                                <button type="button" onClick={() => setMode('view')} style={{ padding: '10px 25px', background: '#e9ecef', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Hủy bỏ
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}