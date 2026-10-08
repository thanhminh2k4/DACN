// Tệp: frontend/src/pages/OrderManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Admin.css'; 
import '../styles/OrderManagement.css';

export default function OrderManagement() {
    const navigate = useNavigate();
    const role = sessionStorage.getItem('role');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (role !== 'Admin' && role !== 'Staff') {
            alert("Bạn không có quyền truy cập trang này!");
            navigate('/');
            return;
        }
        fetchOrders();
    }, [role, navigate]);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/admin/all');
            setOrders(res.data.orders);
        } catch (error) {
            console.error("Lỗi khi tải đơn hàng", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, currentStatus, newStatus) => {
        if (currentStatus === newStatus) return;
        
        const confirmMsg = newStatus === 'Đã hủy' 
            ? "Bạn có chắc muốn HỦY đơn hàng này? (Số lượng sẽ được cộng lại vào kho)"
            : `Đổi trạng thái thành "${newStatus}"?`;

        if (window.confirm(confirmMsg)) {
            try {
                await api.put(`/orders/admin/update/${orderId}`, { status: newStatus });
                alert("Cập nhật trạng thái thành công!");
                fetchOrders(); // Load lại danh sách
            } catch (error) {
                alert("Lỗi khi cập nhật trạng thái");
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
        <div className="admin-container" style={{ maxWidth: '1200px' }}>
            <div className="admin-header">
                <h2>Quản lý Đơn hàng </h2>
                <button className="btn-action" onClick={() => navigate('/')}>Về Trang chủ</button>
            </div>

            {loading ? (
                <p>Đang tải danh sách đơn hàng...</p>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Mã Đơn</th>
                            <th>Ngày đặt</th>
                            <th>Khách hàng</th>
                            <th>Sản phẩm</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                            <th>Cập nhật</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order._id}>
                                <td><strong>{order.order_id}</strong></td>
                                <td>{order.created_at}</td>
                                <td>
                                    <div><strong>{order.username}</strong></div>
                                    <div style={{fontSize: '13px', color: '#555'}}>{order.phone}</div>
                                    <div style={{fontSize: '13px', color: '#555'}}>{order.shipping_address}</div>
                                </td>
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
                                <td className="order-actions">
                                    <select 
                                        defaultValue={order.status}
                                        onChange={(e) => handleStatusUpdate(order._id, order.status, e.target.value)}
                                        disabled={order.status === 'Hoàn thành' || order.status === 'Đã hủy'}
                                    >
                                        <option value="Chờ duyệt">Chờ duyệt</option>
                                        <option value="Đang giao">Đang giao</option>
                                        <option value="Hoàn thành">Hoàn thành</option>
                                        <option value="Đã hủy">Hủy đơn</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}