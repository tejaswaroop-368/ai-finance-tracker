import "./components/style.css";

import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Accounts from "./components/Accounts";
import Transactions from "./components/Transactions";
import Insights from "./components/Insights";
import Profile from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthenticatedLayout from "./components/AuthenticatedLayout";

import { Routes, Route, Navigate } from "react-router";

function App() {
  return (
    <Routes>
      {/* Redirect "/" to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/sign-up" element={<Signup />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/home" element={<Dashboard />} />
          <Route path="/home/accounts" element={<Accounts />} />
          <Route path="/home/transactions" element={<Transactions />} />
          <Route path="/home/insights" element={<Insights />} />
          <Route path="/home/profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;