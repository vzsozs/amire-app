// src/pages/JobDetailPage.jsx (TELJES, VÉGLEGES, HIBAMENTES KÓD)
import React, { useState, useContext, useEffect, useRef } from 'react'; // useRef hozzáadva
import { useParams, useNavigate } from 'react-router-dom';
import { TeamContext } from '../context/TeamContext';
import { JobContext } from '../context/JobContext';
import { toYYYYMMDD } from '../utils/date';
import { FaArrowLeft, FaTrash, FaUserPlus, FaTimesCircle, FaPencilAlt, FaChevronLeft, FaChevronRight, FaCheckSquare, FaRegSquare, FaTrashAlt, FaChevronDown, FaChevronUp, FaPlus, FaSave } from 'react-icons/fa';
import Modal from '../components/Modal';
import EditJobForm from '../components/EditJobForm';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './JobDetailPage.css';
import './JobScheduleCalendar.css';

function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { team } = useContext(TeamContext);
  const { jobs, deleteJob, saveJobChanges, isSaving } = useContext(JobContext);

  const originalJob = jobs.find(j => String(j.id) === String(jobId));
  
  const [editedJob, setEditedJob] = useState(null);
  const [newTodoText, setNewTodoText] = useState('');
  const [showCompletedTodos, setShowCompletedTodos] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeStartDate, setActiveStartDate] = useState(new Date());
  const [calendarKey, setCalendarKey] = useState(Date.now()); // EZT A SORT ADD HOZZÁ

  // Ref-ek a legfrissebb állapot tárolására a cleanup funkcióhoz
  const editedJobRef = useRef(editedJob);
  const originalJobRef = useRef(originalJob);
  const saveChangesFuncRef = useRef(saveJobChanges);

  useEffect(() => {
    if (originalJob) {
      const jobCopy = JSON.parse(JSON.stringify(originalJob));
      setEditedJob(jobCopy);
      if (originalJob.deadline) {
        setActiveStartDate(new Date(originalJob.deadline));
      }
    }
  }, [originalJob]);
  
  // A ref-ek frissítése minden rendereléskor
  useEffect(() => {
    editedJobRef.current = editedJob;
    originalJobRef.current = originalJob;
    saveChangesFuncRef.current = saveJobChanges;
  });

  // Automatikus mentés a komponens elhagyásakor
  useEffect(() => {
    return () => {
      const hasUnsavedChanges = editedJobRef.current ? JSON.stringify(originalJobRef.current) !== JSON.stringify(editedJobRef.current) : false;

      if (hasUnsavedChanges) {
        console.log("Elnavigálás mentetlen változtatásokkal, automatikus mentés indul...");
        const changedFields = {};
        Object.keys(editedJobRef.current).forEach(key => {
            if(JSON.stringify(editedJobRef.current[key]) !== JSON.stringify(originalJobRef.current[key])) {
                changedFields[key] = editedJobRef.current[key];
            }
        });
        if (Object.keys(changedFields).length > 0) {
            saveChangesFuncRef.current(originalJobRef.current.id, changedFields);
        }
      }
    };
  }, []); // Üres függőségi lista, hogy csak unmount-kor fusson le

  if (!editedJob) {
    return (
      <div className="job-detail-page">
        <h2>Adatok betöltése...</h2>
        <button onClick={() => navigate('/tasks')} className="back-button" style={{ marginTop: '20px' }}>
          <FaArrowLeft /> Vissza a listához
        </button>
      </div>
    );
  }

  const hasChanges = JSON.stringify(originalJob) !== JSON.stringify(editedJob);

  const handleSaveChanges = async () => {
    const changedFields = {};
    Object.keys(editedJob).forEach(key => {
        if(JSON.stringify(editedJob[key]) !== JSON.stringify(originalJob[key])) {
            changedFields[key] = editedJob[key];
        }
    });
    if (Object.keys(changedFields).length > 0) {
        await saveJobChanges(originalJob.id, changedFields);
    }
  };
  
  const handleDeleteJob = () => {
    const isConfirmed = window.confirm(`Biztosan törölni szeretné a(z) "${editedJob.title}" nevű munkát?`);
    if (isConfirmed) {
      deleteJob(originalJob.id); 
      navigate('/tasks');
    }
  };

  const handleAddTodo = () => {
    if (newTodoText.trim() === '') return;
    const newTodo = { id: Date.now(), text: newTodoText, completed: false };
    setEditedJob(prevJob => ({ ...prevJob, todoList: [...(prevJob.todoList || []), newTodo] }));
    setNewTodoText('');
  };

  const handleToggleTodo = (todoId) => {
    setEditedJob(prevJob => ({ ...prevJob, todoList: prevJob.todoList.map(item =>
        item.id === todoId ? { ...item, completed: !item.completed } : item
    )}));
  };

  const handleDeleteTodo = (todoId) => {
    setEditedJob(prevJob => ({ ...prevJob, todoList: prevJob.todoList.filter(item => item.id !== todoId) }));
  };
  
  const handleJobDayClick = (date) => {
    const dateString = toYYYYMMDD(date);
    setEditedJob(prevJob => {
      const schedule = prevJob.schedule || [];
      const newSchedule = schedule.includes(dateString)
        ? schedule.filter(d => d !== dateString)
        : [...schedule, dateString].sort();
      return { ...prevJob, schedule: newSchedule };
    });
    setCalendarKey(Date.now());
  };
  
  const handleAssignMember = (memberId) => {
    setEditedJob(prevJob => ({ ...prevJob, assignedTeam: [...(prevJob.assignedTeam || []), memberId] }));
    setIsAssignModalOpen(false);
  };
  
  const handleUnassignMember = (memberId) => {
    setEditedJob(prevJob => ({ ...prevJob, assignedTeam: (prevJob.assignedTeam || []).filter(id => id !== memberId) }));
  };
  
  const handleJobPrevMonth = () => { setActiveStartDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); };
  const handleJobNextMonth = () => { setActiveStartDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); };
  
  const getJobTileClassName = ({ date, view }) => {
    if (view === 'month' && editedJob.schedule) {
      const dateString = toYYYYMMDD(date);
      if (editedJob.schedule.includes(dateString)) {
        return 'scheduled-day';
      }
    }
    return null;
  };

  const assignedMembers = team.filter(member => editedJob.assignedTeam?.includes(member.id));
  const availableMembers = team.filter(member => !editedJob.assignedTeam?.includes(member.id));
  const uncompletedTodos = (editedJob.todoList || []).filter(item => !item.completed);
  const completedTodos = (editedJob.todoList || []).filter(item => item.completed);

  return (
    <>
      <div className="job-detail-page">
        <div className="detail-header">
          <button onClick={() => navigate('/tasks')} className="back-button icon-button"><FaArrowLeft /></button>
          <div className="header-buttons">
            {hasChanges && (
              <button onClick={handleSaveChanges} disabled={isSaving} className="save-changes-button header-save-button purple">
                <FaSave /> {isSaving ? 'Mentés...' : 'Mentés'}
              </button>
            )}
            <button onClick={() => setIsEditModalOpen(true)} className="edit-button"><FaPencilAlt /> Szerkesztés</button>
          </div>
        </div>
        
        <h1>{editedJob.title}</h1>
        <p className="job-status-badge" data-status={editedJob.status}>{editedJob.status}</p>

        <div className="detail-section"><h3>Leírás</h3><p>{editedJob.description || 'Nincs megadva leírás.'}</p></div>

        <div className="detail-section">
          <div className="section-header"><h3>Teendők</h3></div>
          <div className="todo-list-container">
            {uncompletedTodos.map(item => (
              <div key={item.id} className="todo-item">
                <button onClick={() => handleToggleTodo(item.id)} className="todo-checkbox"><FaRegSquare /></button>
                <span className="todo-text">{item.text}</span>
                <button onClick={() => handleDeleteTodo(item.id)} className="todo-delete-button"><FaTrashAlt /></button>
              </div>
            ))}
            {uncompletedTodos.length === 0 && completedTodos.length === 0 && <p className="no-data-message">Nincsenek még teendők.</p>}
            {completedTodos.length > 0 && (
              <div className="completed-todos-section">
                <button onClick={() => setShowCompletedTodos(prev => !prev)} className="toggle-completed-button">
                  {showCompletedTodos ? <FaChevronUp /> : <FaChevronDown />} Elvégzett teendők ({completedTodos.length})
                </button>
                {showCompletedTodos && (
                  <div className="completed-list">
                    {completedTodos.map(item => (
                      <div key={item.id} className="todo-item completed">
                        <button onClick={() => handleToggleTodo(item.id)} className="todo-checkbox"><FaCheckSquare /></button>
                        <span className="todo-text">{item.text}</span>
                        <button onClick={() => handleDeleteTodo(item.id)} className="todo-delete-button"><FaTrashAlt /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="add-todo-form">
              <input type="text" className="add-todo-input" value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()} placeholder="Új teendő..."/>
              <button onClick={handleAddTodo} className="add-todo-button"><FaPlus /></button>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Munka ütemezése</h3>
          <div className="calendar-wrapper-dark">
            <Calendar
              key={calendarKey}
              onClickDay={handleJobDayClick}
              tileClassName={getJobTileClassName}
              locale="hu-HU"
              showNeighboringMonth={false}
              activeStartDate={activeStartDate}
              onActiveStartDateChange={({ activeStartDate }) => setActiveStartDate(activeStartDate)}
              prev2Label={null}
              next2Label={null}
            />
             <div className="custom-calendar-nav-dark">
              <button onClick={handleJobPrevMonth} className="custom-nav-button-dark"><FaChevronLeft /></button>
              <button onClick={handleJobNextMonth} className="custom-nav-button-dark"><FaChevronRight /></button>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <div className="section-header">
            <h3>Akik csinálják</h3>
            <button onClick={() => setIsAssignModalOpen(true)} className="assign-button"><FaUserPlus /> Hozzárendelés</button>
          </div>
          <div className="assigned-members-list">
            {assignedMembers.length > 0 ? (
              assignedMembers.map(member => (
                <div key={member.id} className="assigned-member-item" style={{ borderLeftColor: member.color }}>
                  <span className="member-name">{member.name}</span>
                  <button onClick={() => handleUnassignMember(member.id)} className="unassign-button"><FaTimesCircle /></button>
                </div>
              ))
            ) : <p className="no-data-message">Nincsenek csapattagok hozzárendelve.</p>}
          </div>
        </div>

        <div className="detail-section"><h3>Határidő</h3><p>{editedJob.deadline}</p></div>
      </div>
      
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)}>
        <div className="assign-modal-content">
          <h2>Csapattag hozzárendelése</h2>
          <div className="available-members-list">
            {availableMembers.length > 0 ? (
              availableMembers.map(member => (
                <div key={member.id} className="available-member-item" onClick={() => handleAssignMember(member.id)}>
                  <span className="color-dot" style={{ backgroundColor: member.color }}></span>
                  <span className="member-name">{member.name}</span>
                  <span className="member-role">{member.role}</span>
                </div>
              ))
            ) : <p className="no-data-message">Nincs több hozzárendelhető csapattag.</p>}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <EditJobForm jobToEdit={originalJob} onCancel={() => setIsEditModalOpen(false)} onDelete={handleDeleteJob} />
      </Modal>
    </>
  );
}

export default JobDetailPage;