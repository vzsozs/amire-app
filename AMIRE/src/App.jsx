// src/App.jsx (LETISZTÍTOTT ÉS JAVÍTOTT STRUKTÚRA)
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TeamProvider } from './context/TeamProvider'; 
import { ToastProvider } from './context/ToastProvider';
import Toast from './components/Toast';
import { JobProvider } from './context/JobProvider';
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
  // A 'dailyNotes' logikát teljesen eltávolítjuk, a HomePage-nek már nincs rá szüksége
  // a Context-alapú rendszerben.

  return (
    // A ToastProvider veszi körbe a teljes alkalmazást
    <ToastProvider>
      <TeamProvider>
        <JobProvider>
          <Router>
            {/* Ez a div lesz a fő konténerünk, amire a CSS-t alkalmazzuk */}
            <div className="App"> 
              <Header />
              <div className="main-content-area">
                <Sidebar />
                <main className="app-content">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/tasks/:jobId" element={<JobDetailPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
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
      {/* A Toast komponenst a Router-en KÍVÜL helyezzük el,
          hogy mindig minden felett látható legyen. */}
      <Toast />
    </ToastProvider>
  );
}

export default App;