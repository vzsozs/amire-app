// src/components/AddJobForm.jsx (VÉGLEGES, JAVÍTOTT VERZIÓ)
import React, { useState, useContext } from 'react'; // useContext hozzáadva
import { JobContext } from '../context/JobContext'; // JobContext importálása
import { FaUserCircle } from 'react-icons/fa';
import './AddJobForm.css';

// Az 'onAddJob' propra már nincs szükség, mert a Context-et használjuk
function AddJobForm({ team, onCancel }) {
  // --- STATE HOOKS ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); // Új állapot a leíráshoz
  const [status, setStatus] = useState('Függőben'); // Jobb alapértelmezett a 'Függőben'
  const [deadline, setDeadline] = useState('');
  const [selectedTeam, setSelectedTeam] = useState([]);

  // --- CONTEXT ---
  // Közvetlenül a JobContext-ből vesszük ki az 'addJob' függvényt
  const { addJob } = useContext(JobContext);

  // --- HANDLER FUNCTIONS ---
  const handleTeamSelect = (memberId) => {
    setSelectedTeam(prevSelected =>
      prevSelected.includes(memberId)
        ? prevSelected.filter(id => id !== memberId)
        : [...prevSelected, memberId]
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!title || !deadline) {
      alert('A munka neve és a határidő megadása kötelező!');
      return;
    }

    // Létrehozzuk a teljes, konzisztens munka objektumot
    const newJobData = {
      title,
      description,
      status,
      deadline,
      assignedTeam: selectedTeam,
      // --- ALAPÉRTELMEZETT ÉRTÉKEK HOZZÁADÁSA ---
      color: '#808080',      // Alapértelmezett szürke szín
      schedule: [],         // Kezdetben üres ütemezés
      todoList: [],         // Kezdetben üres teendő lista
    };
    
    // Meghívjuk a Context-ből kapott addJob függvényt
    addJob(newJobData);
    
    // Bezárjuk a modált
    onCancel(); 
  };

  return (
    <form className="add-job-form" onSubmit={handleSubmit}>
      <h2>Új munka hozzáadása</h2>
      <div className="form-group">
        <label htmlFor="job-title">Munka neve</label>
        <input
          type="text"
          id="job-title"
          placeholder="Pl.: Gábor Lakásfelújítás"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      {/* --- ÚJ: LEÍRÁS MEZŐ --- */}
      <div className="form-group">
        <label htmlFor="job-description">Leírás (opcionális)</label>
        <textarea
            id="job-description"
            placeholder="Rövid leírás a munkáról..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-group-row"> {/* Jobb elrendezéshez egy sorba tesszük őket */}
        <div className="form-group">
            <label htmlFor="job-status">Státusz</label>
            <select
            id="job-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            >
            <option value="Függőben">Függőben</option>
            <option value="Folyamatban">Folyamatban</option>
            <option value="Befejezve">Befejezve</option>
            </select>
        </div>
        <div className="form-group">
            <label htmlFor="job-deadline">Határidő</label>
            <input
            type="date"
            id="job-deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            />
        </div>
      </div>
      
      <div className="form-group">
        <label>Csapattagok hozzárendelése</label>
        <div className="team-selection-list">
          {team.map(member => (
            <div
              key={member.id}
              className={`team-selection-item ${selectedTeam.includes(member.id) ? 'selected' : ''}`}
              onClick={() => handleTeamSelect(member.id)}
            >
              <FaUserCircle className="avatar" style={{ color: member.color }} />
              <span className="name">{member.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="button-secondary" onClick={onCancel}>Mégse</button>
        <button type="submit" className="button-primary">Munka létrehozása</button>
      </div>
    </form>
  );
}

export default AddJobForm;