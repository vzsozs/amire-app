// src/context/TeamProvider.jsx (VÉGLEGES, EGYSZERŰSÍTETT VERZIÓ)
import React, { useState, useEffect, useCallback } from 'react';
import { TeamContext } from './TeamContext';
import { useToast } from './useToast';

const API_BASE_URL = '/api';

export const TeamProvider = ({ children }) => {
  const [team, setTeam] = useState([]);
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/team`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTeam(data);
    } catch (error) {
      console.error("Hiba a csapatadatok lekérésekor:", error);
      showToast("Hiba a csapatadatok betöltésekor!", "error");
    }
  }, [showToast]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const addTeamMember = async (newMemberData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemberData),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const newMember = await response.json();
      setTeam(prevTeam => [...prevTeam, newMember]);
      showToast("Csapattag sikeresen hozzáadva!", "success");
    } catch (error) {
      console.error("Hiba új csapattag hozzáadása során:", error);
      showToast("Hiba új csapattag hozzáadása során!", "error");
    }
  };
  
   const deleteTeamMember = async (memberId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/team/${memberId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      // Frissítjük a helyi állapotot a törölt tag eltávolításával
      setTeam(prevTeam => prevTeam.filter(member => String(member.id) !== String(memberId)));
      showToast("Csapattag sikeresen törölve!", "success");
    } catch (error) {
      console.error("Hiba csapattag törlésekor:", error);
      showToast("Hiba csapattag törlésekor!", "error");
    }
  };

  // EGYETLEN, ERŐTELJES MENTÉSI FÜGGVÉNY A VÁLTOZTATÁSOKHOZ
  const saveTeamMemberChanges = async (memberId, updatedFields) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (!response.ok) throw new Error('Szerverhiba a mentés során.');
      
      const updatedMemberFromServer = await response.json();
      setTeam(prevTeam => prevTeam.map(member =>
        String(member.id) === String(memberId) ? updatedMemberFromServer : member
      ));
      showToast("Változtatások sikeresen mentve!", "success");
      return true;
    } catch (error) {
      console.error("Hiba a mentés során:", error);
      showToast("Hiba a mentéskor!", "error");
      fetchTeam(); // Hiba esetén újraszinkronizálunk
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const value = {
    team,
    isSaving,
    addTeamMember,
    deleteTeamMember,
    saveTeamMemberChanges,
    fetchTeam, // <-- EZT A SORT ADD HOZZÁ
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};