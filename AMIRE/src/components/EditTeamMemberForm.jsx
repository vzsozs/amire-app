// src/components/EditTeamMemberForm.jsx
import React, { useState, useContext } from 'react';
import { TeamContext } from '../context/TeamContext'; // A TeamContext-re lesz szükségünk
import './AddJobForm.css'; // Újrahasznosítjuk a meglévő CSS-t
import ColorPalette from './ColorPalette'; // A te komponensed importálása
import { FaTrash } from 'react-icons/fa'; // FaTrash importálása

const PRESET_COLORS = [
  '#FF6F00', '#3F51B5', '#00BCD4', '#8BC34A',
  '#F44336', '#E91E63', '#9C27B0', '#673AB7',
  '#4CAF50', '#FFEB3B', '#FF9800', '#795548'
];

function EditTeamMemberForm({ memberToEdit, onCancel, onDelete }) {
  const { saveTeamMemberChanges } = useContext(TeamContext);

  // Az űrlap állapotát feltöltjük a szerkesztendő csapattag adataival
  const [name, setName] = useState(memberToEdit.name || '');
  const [role, setRole] = useState(memberToEdit.role || '');
  const [phone, setPhone] = useState(memberToEdit.phone || '');
  const [email, setEmail] = useState(memberToEdit.email || '');
  const [color, setColor] = useState(memberToEdit.color || '#808080');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name || !role) {
      alert('A név és a szerepkör megadása kötelező!');
      return;
    }

    const updatedFields = {
      name,
      role,
      phone,
      email,
      color,
    };

    // Meghívjuk a providerből a mentési függvényt
    await saveTeamMemberChanges(memberToEdit.id, updatedFields);

    onCancel(); // Bezárja a modált
  };

  return (
    <form className="add-job-form" onSubmit={handleSubmit}>
      <h2>Csapattag szerkesztése</h2>

      {/* --- TÖRLÉS GOMB HOZZÁADÁSA --- */}
      <div className="form-group form-group-danger">
        <button type="button" className="button-danger-subtle full-width" onClick={onDelete}>
          <FaTrash /> Csapattag végleges törlése
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="member-name">Név</label>
        <input type="text" id="member-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="member-role">Szerepkör</label>
        <input type="text" id="member-role" value={role} onChange={(e) => setRole(e.target.value)} required />
      </div>
       <div className="form-group-row">
            <div className="form-group">
                <label htmlFor="member-phone">Telefon</label>
                <input type="tel" id="member-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="member-email">Email</label>
                <input type="email" id="member-email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
        </div>
        
        <div className="form-group">
            <label>Szín</label>
            <ColorPalette
                colors={PRESET_COLORS}
                selectedColor={color}
                onColorChange={setColor}
            />
        </div>

      <div className="form-actions">
        <button type="button" className="button-secondary" onClick={onCancel}>Mégse</button>
        <button type="submit" className="button-primary">Módosítások mentése</button>
      </div>
    </form>
  );
}

export default EditTeamMemberForm;