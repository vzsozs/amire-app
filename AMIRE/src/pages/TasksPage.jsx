// src/pages/TasksPage.jsx (VÉGLEGES, LEBEGŐ GOMBOS ÉS LETISZTÍTOTT VERZIÓ)
import React, { useState, useContext } from 'react';
import { TeamContext } from '../context/TeamContext';
import { JobContext } from '../context/JobContext';
import EmptyState from '../components/EmptyState';
import JobItem from '../components/JobItem';
import Modal from '../components/Modal';
import AddJobForm from '../components/AddJobForm';
import { FaPlus, FaTasks } from 'react-icons/fa';
import './TasksPage.css';

function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { team } = useContext(TeamContext); 
  const { jobs } = useContext(JobContext);

  // A handleFormSubmit függvényre már nincs szükség, mert az AddJobForm a Context-et használja
  // const handleFormSubmit = (newJobData) => { ... };

  // Az aktív és befejezett munkák szűrése (ez a logika hiányzott a te kódodból)
  const activeJobs = jobs.filter(job => job.status === 'Folyamatban' || job.status === 'Függőben');
  const completedJobs = jobs.filter(job => job.status === 'Befejezve');

  return (
    // A React Fragment (<>...</>) körbeveszi a konténert és a gombot
    <>
      <div className="tasks-page-container">
        <div className="tasks-page-header">
          <h1>Munkák</h1> 
          <p>Itt vihetsz fel és kezelheted a munkákat.</p> 
        </div>

        {/* A munkákat szétválasztjuk aktív és befejezett listákra a jobb átláthatóságért */}
        <div className="job-list-section">
          <h2>Aktív munkák ({activeJobs.length})</h2>
          <div className="job-list">
            {activeJobs.length > 0 ? (
              activeJobs.map(job => <JobItem key={job.id} job={job} />)
            ) : (
                <EmptyState 
                    icon={<FaTasks />} 
                    title="Nincs aktív munka" 
                    message="Kattints a '+' gombra az első munka hozzáadásához!" 
                />
            )}
          </div>
        </div>

        <div className="job-list-section">
          <h2>Befejezett munkák ({completedJobs.length})</h2>
          <div className="job-list">
            {completedJobs.length > 0 ? (
              completedJobs.map(job => <JobItem key={job.id} job={job} />)
            ) : (
              <p className="no-data-message">Nincsenek befejezett munkák.</p>
            )}
          </div>
        </div>
        
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <AddJobForm
            team={team}
            onCancel={() => setIsModalOpen(false)}
            // Az onAddJob propot eltávolítottuk
          />
        </Modal>
      </div> {/* A .tasks-page-container itt bezárul */}

      {/* A gomb a konténeren kívülre került */}
      <button onClick={() => setIsModalOpen(true)} className="fab fab-add" aria-label="Új munka">
        <FaPlus />
      </button>
    </>
  );
}

export default TasksPage;