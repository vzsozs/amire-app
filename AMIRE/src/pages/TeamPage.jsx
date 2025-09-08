// src/pages/TasksPage.jsx
import React, { useState, useContext } from 'react'; // useContext importálása
import { TeamContext } from '../context/TeamContext'; // 'useTeam' helyett 'TeamContext'
import TeamMemberItem from '../components/TeamMemberItem';
import Modal from '../components/Modal';
import AddTeamMemberForm from '../components/AddTeamMemberForm';
import { FaPlus, FaUserPlus } from 'react-icons/fa'; // FaUsers ikon
import EmptyState from '../components/EmptyState'; // ÚJ IMPORT
import './TasksPage.css';
import '../components/Fab.css';
import { useToast } from '../context/useToast'; // EZ A JAVÍTÁS

function TeamPage() { 
  const { team, addTeamMember } = useContext(TeamContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast(); // ITT KEZDJÜK HASZNÁLNI

  const handleFormSubmit = (newMemberData) => { 
    addTeamMember(newMemberData); 
    setIsModalOpen(false);
    showToast('Csapattag sikeresen hozzáadva!', 'success'); // Példa a használatra
  };

  return (
    <div className="tasks-page-container">
      <div className="tasks-page-header">
        <h1>Csapat</h1> 
        <p>Az AMIRE csapattagjai, munkanapjaik és lérhetőségük.</p> 
      </div>
      <div className="job-list">
        {team.map(person => ( 
          <TeamMemberItem key={person.id} person={person} /> 
        ))}
      </div>
      <button onClick={() => setIsModalOpen(true)} className="fab fab-add" aria-label="Új tag">
        <FaUserPlus />
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <AddTeamMemberForm
          onCancel={() => setIsModalOpen(false)}
          onAddTeamMember={handleFormSubmit} 
        />
      </Modal>
    </div>
  );
}

export default TeamPage;