import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductManagement from './pages/ProductManagement';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/products" element={<ProductManagement />} />
        <Route path="/manage-users" element={<UserManagement />} />
        {/* Sau này có thể thêm các Route như /cart, /dashboard */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;