// src/App.jsx
import React, { useState } from 'react'; // 'useEffect' már nem kell itt
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TeamProvider } from './context/TeamProvider'; 
// import moment from 'moment'; // Moment.js már nem kell itt, mert a util függvény használja
import { ToastProvider } from './context/ToastProvider';
import Toast from './components/Toast';
import { JobProvider } from './context/JobProvider'; // ÚJ IMPORT
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import TeamPage from './pages/TeamPage';
import TeamMemberDetailPage from './pages/TeamMemberDetailPage';
import JobDetailPage from './pages/JobDetailPage';
import Sidebar from './components/Sidebar';


function App() {
  // A 'jobs' és 'dailyNotes' állapotokat INNEN TÖRÖLTÜK, 
  // mert a 'JobProvider' és 'HomePage' (dailyNotes) kezelik őket
  // const [jobs, setJobs] = useState(initialJobs);
  const [dailyNotes, setDailyNotes] = useState({}); // Ezt még át kell gondolni, de most bent hagyjuk

  // A jegyzetek öröklését most a HomePage kezeli majd
  /*
  useEffect(() => {
    // ...
  }, []);
  */

  // AZ ÖSSZES handle...Job és handle...TodoItem FÜGGVÉNYT INNEN TÖRÖLTÜK,
  // MERT A JobProvider KEZELI ŐKET
  /*
  const handleAddJob = (...) => { ... };
  const handleDeleteJob = (...) => { ... };
  const handleUpdateJob = (...) => { ... };
  const handleAssignTeamMember = (...) => { ... };
  const handleUnassignTeamMember = (...) => { ... };
  const handleToggleJobSchedule = (...) => { ... };
  const handleAddTodoItem = (...) => { ... };
  const handleToggleTodoItem = (...) => { ... };
  const handleDeleteTodoItem = (...) => { ... };
  */

  // Csak a napi jegyzetekhez tartozó függvények maradnak, ha megtartjuk a napi jegyzeteket
  // Később ezt is átadhatjuk egy Context-nek, ha bonyolódik
  const handleAddNote = (dateString, noteText) => {
    const newNote = { id: Date.now(), text: noteText, completed: false };
    setDailyNotes(prevNotes => {
      const notesForDay = prevNotes[dateString] || [];
      return { ...prevNotes, [dateString]: [...notesForDay, newNote] };
    });
  };

  const handleToggleNote = (dateString, noteId) => {
    setDailyNotes(prevNotes => {
      const notesForDay = prevNotes[dateString] || [];
      const updatedNotes = notesForDay.map(note => note.id === noteId ? { ...note, completed: !note.completed } : note);
      return { ...prevNotes, [dateString]: updatedNotes };
    });
  };


  return (
    <ToastProvider>
      <TeamProvider>
        <JobProvider>
          <Router>
            <div className="App-layout-wrapper">
              <Header />
              <div className="main-content-area">
                <Sidebar />
                <main className="app-content">
                  <Routes>
                    {/* A HomePage már nem kapja meg a 'jobs' és a 'notes' propokat, Context-ből olvassa */}
                    <Route path="/" element={<HomePage notes={dailyNotes} onAddNote={handleAddNote} onToggleNote={handleToggleNote} />} />
                    {/* A TasksPage és JobDetailPage már nem kapja meg a 'jobs' és 'on...' propokat */}
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/tasks/:jobId" element={<JobDetailPage />} />
                    {/* A CalendarPage már nem kapja meg a 'jobs' propot */}
                    <Route path="/calendar" element={<CalendarPage />} />
                    {/* A TeamPage és TeamMemberDetailPage sem kap már 'team' propot */}
                    <Route path="/team" element={<TeamPage />} />
                    <Route path="/team/:memberId" element={<TeamMemberDetailPage />} />
                  </Routes>
                </main>
              </div>
              <Footer />
            </div>
          </Router>
        </JobProvider>
      </TeamProvider>
      <Toast />
    </ToastProvider>
  );
}

export default App;