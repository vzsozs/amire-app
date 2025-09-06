// src/context/JobProvider.jsx (VÉGLEGES, EGYSZERŰSÍTETT ÉS TELJES VERZIÓ)
import React, { useState, useEffect, useCallback } from 'react';
import { JobContext } from './JobContext';
import { useToast } from './useToast';
import moment from 'moment';

const API_BASE_URL = '/api';

export const JobProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error("Hiba a munkák adatainak lekérésekor:", error);
      showToast("Hiba a munkák betöltésekor!", "error");
    }
  }, [showToast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const addJob = async (newJobData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJobData),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const newJob = await response.json();
      setJobs(prevJobs => [...prevJobs, newJob]);
      showToast("Munka sikeresen hozzáadva!", "success");
    } catch (error) {
      console.error("Hiba új munka hozzáadása során:", error);
      showToast("Hiba új munka hozzáadása során!", "error");
    }
  };

  const deleteJob = async (jobIdToDelete) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobIdToDelete}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setJobs(prevJobs => prevJobs.filter(job => String(job.id) !== String(jobIdToDelete)));
      showToast("Munka sikeresen törölve!", "success");
    } catch (error) {
      console.error("Hiba munka törlésekor:", error);
      showToast("Hiba munka törlésekor!", "error");
    }
  };
  
  // A MENTÉSI FÜGGVÉNY MOST MÁR STABIL A USECALLBACK MIATT
  const saveJobChanges = useCallback(async (jobId, updatedFields) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (!response.ok) throw new Error('Szerverhiba a mentés során.');
      
      const updatedJobFromServer = await response.json();
      setJobs(prevJobs => prevJobs.map(job =>
        String(job.id) === String(jobId) ? updatedJobFromServer : job
      ));
      showToast("Változtatások sikeresen mentve!", "success");
      return true;
    } catch (error) {
      console.error("Hiba a mentés során:", error);
      showToast("Hiba a mentéskor!", "error");
      // Hiba esetén a biztonság kedvéért újraszinkronizálunk
      await fetchJobs(); // Itt is érdemes megvárni
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [showToast, fetchJobs]); // Függőségek hozzáadva
  
  // Ez a függvény a külön EditJobForm modálhoz kell
  const updateJob = async (updatedJobData) => {
    const jobToSend = { ...updatedJobData, deadline: moment(updatedJobData.deadline).format('YYYY-MM-DD') };
    await saveJobChanges(updatedJobData.id, jobToSend);
  };
  
  const value = {
    jobs,
    isSaving,
    addJob,
    deleteJob,
    updateJob,
    saveJobChanges,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};