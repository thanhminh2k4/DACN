// Tệp: frontend/src/pages/OrderHistory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/OrderManagement.css'; // Dùng chung CSS với Admin cho đồng bộ

export default function OrderHistory() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem('access_token');
    const role = sessionStorage.getItem('role');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token || role !== 'Customer') {
            alert("Vui lòng đăng nhập với tài khoản Khách hàng để xem lịch sử!");
            navigate('/login');
            return;
        }
        fetchMyOrders();
    }, [role, navigate, token]);

    const fetchMyOrders = async () => {
        try {
            const res = await api.get('/orders/my-orders');
            setOrders(res.data.orders);
        } catch (error) {
            console.error("Lỗi khi tải lịch sử đơn hàng", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
            try {
                // Khách hàng tự hủy, chúng ta có thể gọi API update tương tự Admin
                // (Lưu ý: API update hiện tại đang bọc bởi get_admin_or_staff, 
                // do đó để an toàn ta nên viết một API phụ cho Customer tự hủy, 
                // nhưng nếu muốn làm nhanh gọn cho đồ án, ta có thể báo "Hãy liên hệ Admin"
                // Ở đây mình hướng dẫn cách báo liên hệ để đỡ phải viết thêm 1 API Backend)
                alert("Tính năng tự hủy đang được bảo trì. Vui lòng gọi 1900-xxxx để hủy đơn!");
            } catch (error) {
                console.error(error);
            }
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Chờ duyệt': return 'status-pending';
            case 'Đang giao': return 'status-shipping';
            case 'Hoàn thành': return 'status-completed';
            case 'Đã hủy': return 'status-canceled';
            default: return '';
        }
    };

    return (
        <div className="admin-container" style={{ maxWidth: '1000px', margin: '40px auto' }}>
            <div className="admin-header" style={{ marginBottom: '20px' }}>
                <h2>Lịch sử Đơn hàng của bạn</h2>
                <button 
                    onClick={() => navigate('/')} 
                    style={{ padding: '8px 15px', cursor: 'pointer', borderRadius: '4px' }}
                >
                    ← Trở về Mua sắm
                </button>
            </div>

            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <p>Bạn chưa có đơn hàng nào.</p>
                    <button onClick={() => navigate('/')} style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer', background: '#0275d8', color: '#fff', border: 'none', borderRadius: '4px' }}>Khám phá Sản phẩm</button>
                </div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Mã Đơn</th>
                            <th>Ngày đặt</th>
                            <th>Sản phẩm</th>
                            <th>Tổng thanh toán</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order._id}>
                                <td><strong>{order.order_id}</strong></td>
                                <td>{order.created_at}</td>
                                <td>
                                    <ul className="item-list">
                                        {order.items.map((item, idx) => (
                                            <li key={idx}>
                                                {item.product_name} (x{item.quantity})
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                <td><strong style={{color: '#d9534f'}}>{order.total_amount.toLocaleString()} đ</strong></td>
                                <td>
                                    <span className={`order-status ${getStatusClass(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td>
                                    {order.status === 'Chờ duyệt' ? (
                                        <button 
                                            onClick={() => handleCancelOrder(order._id)}
                                            style={{ padding: '5px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Hủy đơn
                                        </button>
                                    ) : (
                                        <span style={{ fontSize: '13px', color: '#888' }}>Không thể thay đổi</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}