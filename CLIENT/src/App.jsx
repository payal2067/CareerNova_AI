import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import Interview from './pages/Interview';
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Feedback from "./pages/Feedback";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/feedback" element={<Feedback />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analyze" element={<ProtectedRoute><Analyze /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
