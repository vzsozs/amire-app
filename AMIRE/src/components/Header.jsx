// src/components/Header.jsx
import React from 'react';
// FaBars már nem kell, töröljük az importját
// import { FaBars } from 'react-icons/fa'; 

function Header() {
  return (
    <header className="app-header">
      <span>AMIRE</span>
      {/* TÖRÖLJÜK A HAMBURGER MENÜ IKONT */}
      {/* <FaBars style={{ fontSize: '1.2em', color: 'var(--text-color)' }} /> */}
    </header>
  );
}

export default Header;