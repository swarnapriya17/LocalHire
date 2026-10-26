import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import IntroAnimation from '../components/home/IntroAnimation';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Toast from '../components/common/Toast';
import HeroSection from '../components/home/HeroSection';
import JobCategories from '../components/home/JobCategories';
import JobSection from '../components/home/JobSection';
import EmployerShowcase from '../components/home/EmployerShowcase';
import FresherSection from '../components/home/FresherSection';
import AiAssistantShowcase from '../components/home/AiAssistantShowcase';
import WestGodavariSection from '../components/home/WestGodavariSection';
import CareerResources from '../components/home/CareerResources';
import SavedJobsModal from '../components/home/SavedJobsModal';
import AuthInfoModal from '../components/home/AuthInfoModal';
import PostJobInfoModal from '../components/home/PostJobInfoModal';
import JobDetailsModal from '../components/home/JobDetailsModal';
import { jobService } from '../services/api';
import { mockJobs } from '../data/mockJobs';

export default function HomePage() {
  const navigate = useNavigate();

  // Dynamic jobs state loaded from backend API with mockJobs fallback
  const [jobs, setJobs] = useState(mockJobs);
  const [jobsLoading, setJobsLoading] = useState(false);

  // State for Saved Jobs (persisted in localStorage)
  const [savedJobIds, setSavedJobIds] = useState(() => {
    try {
      const stored = localStorage.getItem('localhire_saved_jobs');
      return stored ? JSON.parse(stored) : ['job-1', 'job-5']; // Default 2 saved demo jobs for quick initial demo
    } catch {
      return ['job-1', 'job-5'];
    }
  });

  // Search & Filtering State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals state
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [directJobModal, setDirectJobModal] = useState(null);

  // Staggered reveal state (triggered when intro finishes or immediately if already viewed)
  const [homepageRevealed, setHomepageRevealed] = useState(() => {
    try {
      const hasSeen = sessionStorage.getItem('localhire_intro_seen');
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return Boolean(hasSeen || prefersReduced);
    } catch {
      return true;
    }
  });

  // Toast notification state
  const [toast, setToast] = useState({ message: '', type: 'info', icon: '✨' });

  const showToast = (message, type = 'info', icon = '✨') => {
    setToast({ message, type, icon });
  };

  // Fetch live jobs from backend API
  const fetchLiveJobs = useCallback(async () => {
    try {
      setJobsLoading(true);
      const res = await jobService.getJobs({ limit: 50 });
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setJobs(res.data);
      }
    } catch (err) {
      console.warn('Backend API job fetch note (falling back to local seed dataset):', err.message);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveJobs();
  }, [fetchLiveJobs]);

  // Persist saved jobs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('localhire_saved_jobs', JSON.stringify(savedJobIds));
    } catch (e) {
      console.warn('Could not persist saved jobs:', e);
    }
  }, [savedJobIds]);

  // Toggle Save Job
  const handleToggleSave = (job) => {
    const jobId = job.id || job._id;
    setSavedJobIds((prev) => {
      const exists = prev.includes(jobId);
      if (exists) {
        showToast(`Removed "${job.title}" from saved jobs.`, 'info', '🤍');
        return prev.filter((id) => id !== jobId);
      } else {
        showToast(`Saved "${job.title}" to your bookmarks!`, 'success', '❤️');
        return [...prev, jobId];
      }
    });
  };

  // Hero Search Submission
  const handleHeroSearch = ({ keyword, location }) => {
    setSearchKeyword(keyword);
    setSelectedLocation(location);
    showToast(
      `Search criteria applied: ${keyword ? `"${keyword}"` : 'All roles'} in ${location === 'all' ? 'West Godavari' : location}.`,
      'info',
      '🔍'
    );
  };

  // Filter Freshers button clicked from FresherSection
  const handleFilterFreshers = () => {
    setSelectedCategory('fresher-opportunities');
    showToast('Filtered by Fresher & Entry-Level roles.', 'info', '🎓');
    const jobsElem = document.getElementById('jobs');
    if (jobsElem) jobsElem.scrollIntoView({ behavior: 'smooth' });
  };

  // Select job from FresherSection highlight
  const handleSelectJobFromHighlight = (jobId) => {
    const job = jobs.find((j) => (j.id || j._id) === jobId) || mockJobs.find((j) => j.id === jobId);
    if (job) {
      setDirectJobModal(job);
    }
  };

  // Saved jobs list objects
  const savedJobsList = jobs.filter((job) => savedJobIds.includes(job.id || job._id));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Opening Intro Animation (approx 2s, only on initial session entry) */}
      <IntroAnimation 
        onStartReveal={() => setHomepageRevealed(true)} 
        onComplete={() => setHomepageRevealed(true)}
      />

      {/* 2. Navigation Bar */}
      <Navbar
        savedCount={savedJobIds.length}
        onOpenSavedJobs={() => setIsSavedOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPostJob={() => setIsPostJobOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {/* 3. Hero Section (Staggered reveal on transition) */}
        <HeroSection
          isRevealed={homepageRevealed}
          onSearch={handleHeroSearch}
          onPostJobClick={() => navigate('/register?role=recruiter')}
          onExploreClick={() => {
            const jobsElem = document.getElementById('jobs');
            if (jobsElem) jobsElem.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 4. Job Categories (8 Pillars) */}
        <JobCategories
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            showToast(
              catId === 'all' 
                ? 'Showing all industry sectors.' 
                : `Filtered by ${catId.replace('-', ' ').toUpperCase()}.`,
              'info',
              '📑'
            );
          }}
        />

        {/* 5. Latest Local Jobs (Search, filters, cards, modal) */}
        <JobSection
          jobs={jobs}
          savedJobIds={savedJobIds}
          onToggleSave={handleToggleSave}
          searchKeyword={searchKeyword}
          onKeywordChange={setSearchKeyword}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onShowToast={showToast}
          isLoading={jobsLoading}
          onRefresh={fetchLiveJobs}
        />

        {/* 6. Verified Employers Showcase */}
        <EmployerShowcase
          onOpenPostJob={() => navigate('/register?role=recruiter')}
        />

        {/* 7. Fresher-Friendly Opportunities */}
        <FresherSection
          onFilterFreshers={handleFilterFreshers}
          onSelectJob={handleSelectJobFromHighlight}
        />

        {/* 8. AI Career Assistant Showcase (Honest Preview) */}
        <AiAssistantShowcase
          onShowToast={showToast}
        />

        {/* 9. West Godavari Regional Opportunities */}
        <WestGodavariSection
          selectedLocation={selectedLocation}
          onSelectTown={(townName) => {
            setSelectedLocation(townName);
            showToast(
              townName === 'all' 
                ? 'Location filter reset to all mandals.' 
                : `Filtered vacancies around ${townName}.`,
              'info',
              '📍'
            );
          }}
        />

        {/* 10. Career Resources & Playbooks */}
        <CareerResources
          onShowToast={showToast}
        />
      </main>

      {/* 11. Footer */}
      <Footer
        onNavClick={(id) => {
          const elem = document.getElementById(id);
          if (elem) elem.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenPostJob={() => setIsPostJobOpen(true)}
        onShowToast={showToast}
      />

      {/* Floating Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        icon={toast.icon}
        onClose={() => setToast({ message: '', type: 'info', icon: '✨' })}
      />

      {/* Saved Jobs Modal */}
      <SavedJobsModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        savedJobs={savedJobsList}
        onRemoveSaved={handleToggleSave}
        onViewDetails={(job) => setDirectJobModal(job)}
      />

      {/* Auth Info Modal (Stage 3 Preview) */}
      <AuthInfoModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onShowToast={showToast}
      />

      {/* Post a Job Info Modal (Stage 3/4 Preview) */}
      <PostJobInfoModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onShowToast={showToast}
      />

      {/* Direct Job Details Modal (from highlights or saved bookmarks) */}
      {directJobModal && (
        <JobDetailsModal
          job={directJobModal}
          isOpen={Boolean(directJobModal)}
          onClose={() => setDirectJobModal(null)}
          isSaved={savedJobIds.includes(directJobModal.id)}
          onToggleSave={handleToggleSave}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}
