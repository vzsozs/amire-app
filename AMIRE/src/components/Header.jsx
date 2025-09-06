// src/components/Header.jsx (LOGÓVAL FRISSÍTVE)
import React from 'react';
import { NavLink } from 'react-router-dom'; // Használjunk NavLink-et, hogy a logó is link legyen
import './Header.css'; // A stílusokhoz szükségünk lesz egy CSS fájlra

function Header() {
  return (
    <header className="app-header">
      <NavLink to="/">
        <img src="/logo.svg" alt="AMIRE logó" className="header-logo" />
      </NavLink>
    </header>
  );
}

export default Header;