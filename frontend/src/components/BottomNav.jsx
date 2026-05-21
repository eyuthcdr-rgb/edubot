import React from 'react';
import { NavLink } from 'react-router-dom';

const navStyle = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  background: 'var(--surface)',
  borderTop: '1px solid var(--border)',
  display: 'flex',
  height: 64,
  zIndex: 100,
};

export default function BottomNav({ isAdmin }) {
  const item = (to, icon, label) => (
    <NavLink to={to} style={({ isActive }) => ({
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 3,
      fontSize: 11, fontWeight: 600, color: isActive ? 'var(--accent)' : 'var(--text2)',
      transition: 'color .15s',
    })}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      {label}
    </NavLink>
  );

  return (
    <nav style={navStyle}>
      {item('/', '🏠', 'Home')}
      {isAdmin && item('/admin', '⚙️', 'Admin')}
    </nav>
  );
}
