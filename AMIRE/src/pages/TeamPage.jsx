// src/pages/TasksPage.jsx
import React, { useState, useContext } from 'react'; // useContext importálása
import { TeamContext } from '../context/TeamContext'; // 'useTeam' helyett 'TeamContext'
import TeamMemberItem from '../components/TeamMemberItem';
import Modal from '../components/Modal';
import AddTeamMemberForm from '../components/AddTeamMemberForm';
import { FaPlus, FaUserPlus } from 'react-icons/fa'; // FaUsers ikon
import EmptyState from '../components/EmptyState'; // ÚJ IMPORT
import './TasksPage.css';
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
      <button className="fab" onClick={() => setIsModalOpen(true)}>
        <FaPlus />
      </button>

       {/* --- ITT VAN A VÁLTOZÁS --- */}
      {/* Ternáris operátorral ellenőrizzük, hogy a 'team' tömb üres-e */}
      <div className="team-list">
        {team.length > 0 ? (
          // Ha NEM üres, listázzuk a csapattagokat
          team.map(member => <TeamMemberItem key={member.id} member={member} />)
        ) : (
          // Ha ÜRES, megjelenítjük az EmptyState komponenst
          <EmptyState
            icon={<FaUserPlus />} // Vagy bármilyen más ikont, pl. FaUsers
            title="Nincsenek csapattagok"
            message="Kattints a '+' gombra az első csapattag hozzáadásához!"
          />
        )}
      </div>
      
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