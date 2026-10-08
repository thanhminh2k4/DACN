import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Admin.css';

export default function UserManagement() {
    const navigate = useNavigate();
    const role = sessionStorage.getItem('role');
    const [users, setUsers] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        username: '', full_name: '', email: '', password: '', role: 'Staff'
    });

    useEffect(() => {
        if (role !== 'Admin') {
            alert("Chỉ Quản trị viên mới được truy cập trang này!");
            navigate('/');
            return;
        }
        fetchUsers();
    }, [role, navigate]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/admin/all');
            setUsers(res.data.users);
        } catch (error) {
            console.error("Lỗi tải danh sách người dùng:", error);
        }
    };

    const handleToggleStatus = async (user) => {
        if (user.is_super_admin) return alert("Không thể can thiệp Admin Tổng!");
        
        const newStatus = user.status === "Vô hiệu" ? "Không hoạt động" : "Vô hiệu";
        if (window.confirm(`Bạn có chắc muốn ${newStatus === "Vô hiệu" ? "VÔ HIỆU HÓA" : "MỞ KHÓA"} tài khoản ${user.username}?`)) {
            try {
                await api.put(`/users/admin/update/${user._id}`, { status: newStatus });
                fetchUsers();
            } catch (err) {
                alert(err.response?.data?.detail || "Lỗi cập nhật trạng thái");
            }
        }
    };

    const handleChangeRole = async (user, newRole) => {
        if (user.is_super_admin) return alert("Không thể can thiệp Admin Tổng!");
        if (user.role === "Customer") return alert("Không thể đổi quyền của Khách hàng từ đây!");

        if (window.confirm(`Đổi quyền tài khoản ${user.username} thành ${newRole}? (Mã ID sẽ thay đổi theo)`)) {
            try {
                await api.put(`/users/admin/update/${user._id}`, { role: newRole });
                fetchUsers();
            } catch (err) {
                alert(err.response?.data?.detail || "Lỗi đổi quyền");
            }
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/admin/create-staff', formData);
            alert(`Đã tạo thành công tài khoản ${formData.role}`);
            setShowModal(false);
            setFormData({ username: '', full_name: '', email: '', password: '', role: 'Staff' });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.detail || "Lỗi tạo tài khoản");
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h2>Quản lý Tài khoản Hệ thống</h2>
                <div>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>+ Tạo Nhân viên/Admin</button>
                    <button className="btn-action" style={{marginLeft: '10px'}} onClick={() => navigate('/')}>Về Trang chủ</button>
                </div>
            </div>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên đăng nhập</th>
                        <th>Họ và tên</th>
                        <th>SĐT</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u._id} style={{ backgroundColor: u.is_super_admin ? '#fff3cd' : 'transparent' }}>
                            <td><strong>{u.custom_id}</strong></td>
                            <td>{u.username}</td>
                            <td>{u.full_name}</td>
                            <td>{u.phone || 'Chưa cập nhật'}</td>
                            <td>
                                {u.role}
                                {u.is_super_admin && <span style={{color: 'red', fontSize: '12px', marginLeft:'5px'}}>(Tổng)</span>}
                            </td>
                            <td style={{ 
                                color: u.status === 'Hoạt động' ? 'green' : u.status === 'Vô hiệu' ? 'red' : 'gray',
                                fontWeight: 'bold'
                            }}>
                                {u.status}
                            </td>
                            <td>
                                {!u.is_super_admin && (
                                    <>
                                        {/* Dropdown đổi quyền nhanh */}
                                        {u.role !== 'Customer' && (
                                            <select 
                                                value={u.role} 
                                                onChange={(e) => handleChangeRole(u, e.target.value)}
                                                style={{ padding: '5px', marginRight: '5px' }}
                                            >
                                                <option value="Staff">Staff</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        )}

                                        {/* Nút Khóa / Mở khóa */}
                                        <button 
                                            className="btn-action" 
                                            style={{ backgroundColor: u.status === 'Vô hiệu' ? '#5cb85c' : '#d9534f' }}
                                            onClick={() => handleToggleStatus(u)}
                                        >
                                            {u.status === 'Vô hiệu' ? 'Mở khóa' : 'Vô hiệu hóa'}
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal Form Tạo Nhân viên */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Tạo tài khoản nội bộ</h3>
                        <form onSubmit={handleCreateUser}>
                            <label>Vai trò:</label>
                            <select 
                                value={formData.role} 
                                onChange={e => setFormData({...formData, role: e.target.value})}
                                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                            >
                                <option value="Staff">Nhân viên (Staff)</option>
                                <option value="Admin">Quản trị viên (Admin)</option>
                            </select>

                            <label>Tên đăng nhập:</label>
                            <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                            
                            <label>Họ và tên:</label>
                            <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                            
                            <label>Email:</label>
                            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            
                            <label>Mật khẩu:</label>
                            <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                            
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className="btn-save">Tạo tài khoản</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}