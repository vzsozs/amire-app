// src/pages/TeamMemberDetailPage.jsx (ÚJ, STABIL, "MENTÉS GOMB" VERZIÓ)
import React, { useState, useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TeamContext } from '../context/TeamContext';
import { FaArrowLeft, FaSave, FaPencilAlt } from 'react-icons/fa'; // FaPencilAlt hozzáadva
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './TeamMemberDetailPage.css';
import { toYYYYMMDD } from '../utils/date';
import EditTeamMemberForm from '../components/EditTeamMemberForm'; // Az új form importálása
import Modal from '../components/Modal'; 


function TeamMemberDetailPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { team, saveTeamMemberChanges, isSaving, deleteTeamMember } = useContext(TeamContext);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [calendarKey, setCalendarKey] = useState(Date.now()); // EZT A SORT ADD HOZZÁ

  // Eredeti, nem módosított 'member' objektum
  const originalMember = team.find(m => String(m.id) === String(memberId));

  // HELYI ÁLLAPOT A SZERKESZTÉSHEZ
  const [editedMember, setEditedMember] = useState(null);
  const [activeStartDate, setActiveStartDate] = useState(new Date());

  // Helyi állapot feltöltése és szinkronizálása
  useEffect(() => {
    if (originalMember) {
      setEditedMember(JSON.parse(JSON.stringify(originalMember)));
    }
  }, [originalMember]);

  // VÁLTOZÁS ELLENŐRZÉSE
  const hasChanges = editedMember ? JSON.stringify(originalMember) !== JSON.stringify(editedMember) : false;

  // AUTOMATIKUS MENTÉS ELNAVIGÁLÁSKOR
  const editedMemberRef = useRef(editedMember);
  const originalMemberRef = useRef(originalMember);
  const saveChangesFuncRef = useRef(saveTeamMemberChanges);

  useEffect(() => {
    editedMemberRef.current = editedMember;
    originalMemberRef.current = originalMember;
    saveChangesFuncRef.current = saveTeamMemberChanges;
  });

  useEffect(() => {
    return () => {
      const hasUnsavedChanges = editedMemberRef.current ? JSON.stringify(originalMemberRef.current) !== JSON.stringify(editedMemberRef.current) : false;
      if (hasUnsavedChanges) {
        console.log("Csapattag oldal elhagyása, automatikus mentés...");
        const changedFields = {};
        Object.keys(editedMemberRef.current).forEach(key => {
            if(JSON.stringify(editedMemberRef.current[key]) !== JSON.stringify(originalMemberRef.current[key])) {
                changedFields[key] = editedMemberRef.current[key];
            }
        });
        if (Object.keys(changedFields).length > 0) {
            saveChangesFuncRef.current(originalMemberRef.current.id, changedFields);
        }
      }
    };
  }, []);

  // BETÖLTÉS ÉS HIBAKEZELÉS
  if (!editedMember) {
    return <div className="team-member-detail-page"><h2>Adatok betöltése...</h2></div>;
  }

  // --- KEZELŐFÜGGVÉNYEK (MIND A HELYI ÁLLAPOTOT MÓDOSÍTJÁK) ---

  const handleDeleteMember = () => {
    const isConfirmed = window.confirm(`Biztosan törölni szeretné ${originalMember.name} nevű csapattagot?`);
    if (isConfirmed) {
      deleteTeamMember(originalMember.id);
      navigate('/team'); // Visszanavigálunk a csapat listára
    }
  };

  const handleSaveChanges = async () => {
    const changedFields = {};
    Object.keys(editedMember).forEach(key => {
        if(JSON.stringify(editedMember[key]) !== JSON.stringify(originalMember[key])) {
            changedFields[key] = editedMember[key];
        }
    });
    if (Object.keys(changedFields).length > 0) {
        await saveTeamMemberChanges(originalMember.id, changedFields);
    }
  };
  
  const handleAvailabilityDayClick = (date) => {
    const dateString = toYYYYMMDD(date);
    setEditedMember(prevMember => {
      const availability = prevMember.availability || [];
      const newAvailability = availability.includes(dateString)
        ? availability.filter(d => d !== dateString)
        : [...availability, dateString].sort();
      return { ...prevMember, availability: newAvailability };
    });
    setCalendarKey(Date.now());
  };
  
  const getAvailabilityTileClassName = ({ date, view }) => {
    if (view === 'month' && editedMember.availability) {
      const dateString = toYYYYMMDD(date);
      if (editedMember.availability.includes(dateString)) {
        return 'available-day'; // CSS osztály a jelölt napokhoz
      }
    }
    return null;
  };

 return (
    <>
      <div className="team-member-detail-page">
        <div className="detail-header">
          <button onClick={() => navigate('/team')} className="back-button icon-button">
            <FaArrowLeft />
          </button>
          <div className="header-buttons">
            {hasChanges && (
              <button onClick={handleSaveChanges} disabled={isSaving} className="save-changes-button header-save-button purple">
                <FaSave /> {isSaving ? 'Mentés...' : 'Mentés'}
              </button>
            )}
            {/* --- ÚJ: SZERKESZTÉS GOMB --- */}
            <button onClick={() => setIsEditModalOpen(true)} className="edit-button">
              <FaPencilAlt /> Szerkesztés
            </button>
          </div>
        </div>

        <div className="member-info-header">
          <div className="color-avatar" style={{ backgroundColor: editedMember.color }}></div>
          <div>
            <h1>{editedMember.name}</h1>
            <p className="member-role">{editedMember.role}</p>
          </div>
        </div>

        {/* ... (A többi JSX rész változatlan) ... */}
         <div className="detail-section">
            <h3>Elérhetőségek</h3>
            <p><strong>Telefon:</strong> {editedMember.phone || 'Nincs megadva'}</p>
            <p><strong>Email:</strong> {editedMember.email || 'Nincs megadva'}</p>
        </div>

        <div className="detail-section">
            <h3>Rendelkezésre állás</h3>
            <div className="calendar-wrapper-dark">
            <Calendar
                key={calendarKey}
                onClickDay={handleAvailabilityDayClick}
                tileClassName={getAvailabilityTileClassName}
                locale="hu-HU"
                showNeighboringMonth={false}
                activeStartDate={activeStartDate}
                onActiveStartDateChange={({ activeStartDate }) => setActiveStartDate(activeStartDate)}
                prev2Label={null}
                next2Label={null}
            />
            </div>
        </div>
      </div>

      {/* --- ÚJ: SZERKESZTŐ MODÁL --- */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <EditTeamMemberForm 
          memberToEdit={originalMember} // Az eredeti adatokat adjuk át a formnak
          onCancel={() => setIsEditModalOpen(false)}
          onDelete={handleDeleteMember}
        />
      </Modal>
    </>
  );
}

export default TeamMemberDetailPage;