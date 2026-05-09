import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../stores/AuthProvider';
import logo from '../../assets/logo.png';
import './Portal.css';

export default function Portal() {
  const { user } = useAuth();
  if (user) return <Navigate to={`/dashboard/${user.role}`} replace />;
  return (
    <main className="portal-wrap">
      <section className="portal-card">
        <img src={logo} alt="BG Sales & Supplies" className="portal-logo" />
        <p className="portal-kicker">Secure Operations Portal</p>
        <h1>BG Services</h1>
        <p className="portal-copy">Access dashboards, employee workflows, inventory, leave, and system administration from one protected workspace.</p>
        <Link className="portal-btn" to="/login">Sign In</Link>
      </section>
    </main>
  );
}
