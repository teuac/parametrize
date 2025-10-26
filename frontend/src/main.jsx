import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Admin from './pages/Admin.jsx'
import RecoverRequest from './pages/RecoverRequest.jsx'
import RecoverReset from './pages/RecoverReset.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { GlobalStyle } from "./styles/GlobalStyles"; // 👈 importa o estilo global
import SessionExpiredModal from './components/SessionExpiredModal.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
  <GlobalStyle /> {/* 👈 aplica o estilo global */}
  <SessionExpiredModal />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/recover" element={<RecoverRequest />} />
        <Route path="/recover/reset" element={<RecoverReset />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
