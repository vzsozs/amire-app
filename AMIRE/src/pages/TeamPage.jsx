// src/pages/TeamPage.jsx (VÉGLEGES, TISZTA VERZIÓ)
import React, { useContext, useState } from 'react';
import { TeamContext } from '../context/TeamContext';
import TeamMemberItem from '../components/TeamMemberItem';
import Modal from '../components/Modal';
import AddTeamMemberForm from '../components/AddTeamMemberForm';
import { FaUserPlus, FaUsers } from 'react-icons/fa';
import EmptyState from '../components/EmptyState';
import './TeamPage.css'; // Az új, saját CSS importálása

function TeamPage() {
  const { team } = useContext(TeamContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

    return (
    <>
      <div className="team-page-container">
        <div className="team-page-header">
          <h1>Csapat</h1> 
          <p>Az AMIRE csapattagjai, munkanapjaik és elérhetőségük.</p> 
        </div>
        <div className="team-list">
          {team.length > 0 ? (
            team.map(member => ( 
              <TeamMemberItem key={member.id} member={member} /> 
            ))
          ) : (
            <EmptyState
                icon={<FaUsers />}
                title="Nincsenek csapattagok"
                message="Kattints a '+' gombra az első csapattag hozzáadásához!"
            />
          )}
        </div>
        
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <AddTeamMemberForm
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      </div>

      <button onClick={() => setIsModalOpen(true)} className="fab fab-add" aria-label="Új tag">
        <FaUserPlus />
      </button>
    </>
  );
}

export default TeamPage;