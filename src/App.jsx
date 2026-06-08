import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './Pages/LandingPage';
import AuthPage from './Pages/AuthPage';
import Dashboard from './Pages/Dashboard';
import NotesPage from './Pages/NotesPage';
import AssignmentsPage from './Pages/AssignmentsPage';
import AIStudyPlanner from './Pages/AIStudyPlanner';
import QuizPage from './Pages/QuizPage';
import FlashcardsPage from './Pages/FlashcardsPage';
import StudyPlannerPage from './Pages/StudyPlannerPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/study-planner" element={<AIStudyPlanner />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/planner" element={<StudyPlannerPage />} />
      </Routes>
    </BrowserRouter>
  );
}