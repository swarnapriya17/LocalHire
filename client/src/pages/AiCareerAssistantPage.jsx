import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { aiService } from '../services/api';
import LanguageSelector from '../components/common/LanguageSelector';
import styles from './AiCareerAssistant.module.css';

export default function AiCareerAssistantPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Active Tool: 'chat' | 'resume' | 'skillgap' | 'interview'
  const [activeTool, setActiveTool] = useState('chat');

  // AI Configuration Status
  const [aiStatus, setAiStatus] = useState({ configured: false, provider: '', model: '', notice: '' });
  const [statusLoading, setStatusLoading] = useState(true);

  // General Notification / Error
  const [errorMessage, setErrorMessage] = useState('');

  // --- TOOL 1: Chat State ---
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I am your LocalHire AI Career Assistant. How can I help with your job search, skills roadmap, or career preparation today in West Godavari?`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // --- TOOL 2: Resume & Profile Improvement State ---
  const [resumeMode, setResumeMode] = useState('stored'); // 'stored' | 'custom'
  const [customHeadline, setCustomHeadline] = useState('');
  const [customSummary, setCustomSummary] = useState('');
  const [customSkills, setCustomSkills] = useState('');
  const [isResumeLoading, setIsResumeLoading] = useState(false);
  const [resumeResult, setResumeResult] = useState(null);
  const [dbNotice, setDbNotice] = useState(false);

  // --- TOOL 3: Skill-Gap Analysis State ---
  const [targetRole, setTargetRole] = useState('Frontend Web Developer');
  const [currentSkillsInput, setCurrentSkillsInput] = useState('HTML, CSS, JavaScript, Basic React');
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [isSkillGapLoading, setIsSkillGapLoading] = useState(false);
  const [skillGapResult, setSkillGapResult] = useState(null);

  // --- TOOL 4: Interview Preparation State ---
  const [interviewMode, setInterviewMode] = useState('questions'); // 'questions' | 'feedback'
  // Question generation inputs
  const [interviewRole, setInterviewRole] = useState('React / Frontend Trainee');
  const [experienceLevel, setExperienceLevel] = useState('Fresher / Entry-Level');
  const [interviewJobDesc, setInterviewJobDesc] = useState('');
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  const [questionsResult, setQuestionsResult] = useState(null);
  // Feedback inputs
  const [feedbackQuestion, setFeedbackQuestion] = useState('Tell me about a challenging bug or project you worked on.');
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState(null);

  // Check AI provider status on mount
  useEffect(() => {
    aiService.getStatus()
      .then((res) => {
        if (res.success && res.data) {
          setAiStatus(res.data);
        }
      })
      .catch((err) => {
        console.warn('AI status check:', err.message);
      })
      .finally(() => {
        setStatusLoading(false);
      });
  }, []);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (activeTool === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTool]);

  // Handle Career Chat Submit
  const handleSendChat = async (messageToSend) => {
    const text = (messageToSend || chatInput).trim();
    if (!text || isChatLoading) return;

    setErrorMessage('');
    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Build conversation history (excluding the initial assistant greeting)
      const historyToSend = updatedMessages.slice(1, -1);
      const res = await aiService.chat({ message: text, history: historyToSend });

      if (res.success && res.data?.reply) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
      }
    } catch (err) {
      const msg = err.message || 'Failed to get AI response. Please try again.';
      setErrorMessage(msg);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${msg}` },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleResetChat = () => {
    setChatMessages([
      {
        role: 'assistant',
        content: `Conversation reset. Feel free to ask any career question or explore job-seeking strategies in West Godavari!`,
      },
    ]);
    setErrorMessage('');
  };

  // Handle Resume Review Submit
  const handleReviewProfile = async () => {
    setIsResumeLoading(true);
    setResumeResult(null);
    setErrorMessage('');
    setDbNotice(false);

    try {
      let customProfile = null;
      if (resumeMode === 'custom') {
        const skillsArray = customSkills.split(',').map((s) => s.trim()).filter(Boolean);
        customProfile = {
          headline: customHeadline,
          summary: customSummary,
          skills: skillsArray,
        };
      }

      const res = await aiService.reviewProfile({ customProfile });
      if (res.success && res.data) {
        setResumeResult(res.data.review);
      }
    } catch (err) {
      if (err.status === 503 && (err.code === 'DATABASE_UNAVAILABLE' || err.message?.includes('MongoDB'))) {
        setDbNotice(true);
      } else {
        setErrorMessage(err.message || 'Profile review request failed.');
      }
    } finally {
      setIsResumeLoading(false);
    }
  };

  // Handle Skill Gap Analysis Submit
  const handleAnalyzeSkillGap = async () => {
    if (!targetRole.trim()) return;
    setIsSkillGapLoading(true);
    setSkillGapResult(null);
    setErrorMessage('');

    try {
      const skillsArray = currentSkillsInput.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await aiService.analyzeSkillGap({
        targetRole,
        currentSkills: skillsArray,
        jobDescription: jobDescriptionInput,
      });

      if (res.success && res.data) {
        setSkillGapResult(res.data.analysis);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Skill-gap analysis failed.');
    } finally {
      setIsSkillGapLoading(false);
    }
  };

  // Handle Interview Questions Submit
  const handleGenerateQuestions = async () => {
    if (!interviewRole.trim()) return;
    setIsQuestionsLoading(true);
    setQuestionsResult(null);
    setErrorMessage('');

    try {
      const res = await aiService.generateInterviewQuestions({
        role: interviewRole,
        experienceLevel,
        jobDescription: interviewJobDesc,
      });

      if (res.success && res.data) {
        setQuestionsResult(res.data.questions);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate interview questions.');
    } finally {
      setIsQuestionsLoading(false);
    }
  };

  // Handle Interview Feedback Submit
  const handleProvideFeedback = async () => {
    if (!practiceAnswer.trim() || practiceAnswer.trim().length < 10) {
      setErrorMessage(t('auth.strengthTooShort', 'Please write at least 10 characters for your practice answer.'));
      return;
    }

    setIsFeedbackLoading(true);
    setFeedbackResult(null);
    setErrorMessage('');

    try {
      const res = await aiService.provideInterviewFeedback({
        question: feedbackQuestion,
        answer: practiceAnswer,
        role: interviewRole,
      });

      if (res.success && res.data) {
        setFeedbackResult(res.data.feedback);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to evaluate interview answer.');
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Header Banner */}
      <header className={styles.headerBanner}>
        <div className={styles.headerInfo}>
          <div className={styles.headerIcon} id="ai-assistant-badge">
            ⚡
          </div>
          <div className={styles.headerText}>
            <h1 className={styles.headerTitle} id="ai-assistant-title">{t('ai.title', 'AI Career Assistant')}</h1>
            <p className={styles.headerSubtitle}>
              {t('ai.subtitle', 'Personalized career guidance, resume improvements, skill-gap roadmaps, and mock interview practice for candidates in West Godavari.')}
            </p>
          </div>
        </div>

        <div className={styles.headerActions} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <LanguageSelector />
          <Link to="/student/dashboard" className={styles.backBtn} id="btn-back-dashboard">
            ← {t('nav.dashboard', 'Candidate Dashboard')}
          </Link>
        </div>
      </header>

      {/* Global Disclaimer Pill */}
      <div className={styles.disclaimerPill} style={{ marginBottom: '1.5rem' }}>
        <span>ℹ️</span>
        <span>
          <strong>{t('ai.disclaimerTitle', 'Informational Guidance:')}</strong> {t('ai.disclaimerDesc', 'AI Career Assistant outputs are advisory suggestions. Always review and personalize recommendations before submitting job applications.')}
        </span>
      </div>

      {/* Unconfigured LLM Notice Banner */}
      {!statusLoading && !aiStatus.configured && (
        <div className={styles.unconfiguredBanner} id="llm-unconfigured-banner">
          <div style={{ fontSize: '1.5rem' }}>⚙️</div>
          <div>
            <h3 className={styles.unconfiguredTitle}>{t('ai.unconfiguredTitle', 'LLM Provider Key Not Configured')}</h3>
            <p className={styles.unconfiguredDesc}>
              {t('ai.unconfiguredDesc', 'The AI Career Assistant requires an API key in the server environment. Set LLM_API_KEY (Google Gemini API key or OpenAI API key) and LLM_PROVIDER=gemini in server/.env to enable live responses.')}
            </p>
          </div>
        </div>
      )}

      {/* Global Error Message */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 8,
            padding: '0.85rem 1.15rem',
            color: '#FCA5A5',
            fontSize: '0.88rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠️ {errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage('')} style={{ color: 'inherit', fontWeight: 700 }}>
            ✕
          </button>
        </div>
      )}

      {/* Tool Navigation Tabs */}
      <nav className={styles.toolTabsBar} aria-label="AI Career Tools">
        <button
          type="button"
          id="tab-tool-chat"
          className={`${styles.toolTabBtn} ${activeTool === 'chat' ? styles.toolTabActive : ''}`}
          onClick={() => setActiveTool('chat')}
        >
          💬 {t('ai.chatTab', 'Career Chat')}
        </button>

        <button
          type="button"
          id="tab-tool-resume"
          className={`${styles.toolTabBtn} ${activeTool === 'resume' ? styles.toolTabActive : ''}`}
          onClick={() => setActiveTool('resume')}
        >
          📄 {t('ai.resumeTab', 'Resume & Profile Review')}
        </button>

        <button
          type="button"
          id="tab-tool-skillgap"
          className={`${styles.toolTabBtn} ${activeTool === 'skillgap' ? styles.toolTabActive : ''}`}
          onClick={() => setActiveTool('skillgap')}
        >
          🎯 {t('ai.skillGapTab', 'Skill-Gap Analysis')}
        </button>

        <button
          type="button"
          id="tab-tool-interview"
          className={`${styles.toolTabBtn} ${activeTool === 'interview' ? styles.toolTabActive : ''}`}
          onClick={() => setActiveTool('interview')}
        >
          🎙️ {t('ai.interviewTab', 'Interview Preparation')}
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* TOOL 1: CAREER CHAT                                                      */}
      {/* ========================================================================= */}
      {activeTool === 'chat' && (
        <div className={styles.mainCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC' }}>
                {t('ai.chatTab', 'Interactive Career Guidance Chat')}
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#94A3B8' }}>
                {t('ai.subtitle', 'Ask questions about career paths, regional employer expectations, fresher resumes, or technical roadmaps.')}
              </p>
            </div>
            <button
              type="button"
              className={styles.clearChatBtn}
              onClick={handleResetChat}
              id="btn-clear-chat"
            >
              🔄 {t('ai.resetChat', 'Reset Conversation')}
            </button>
          </div>

          {/* Chat Window */}
          <div className={styles.chatContainer}>
            <div className={styles.chatMessages} id="chat-messages-container">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${styles.chatBubble} ${
                    msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant
                  }`}
                >
                  <div style={{ fontSize: '0.72rem', color: msg.role === 'user' ? '#DDD6FE' : '#94A3B8', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {msg.role === 'user' ? 'You' : 'LocalHire AI Career Assistant'}
                  </div>
                  {msg.content}
                </div>
              ))}
              {isChatLoading && (
                <div className={`${styles.chatBubble} ${styles.chatBubbleAssistant}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8' }}>
                    <div className={styles.spinner} />
                    <span>{t('ai.analyzing', 'Analyzing your question...')}</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Starter Chips */}
            <div className={styles.chatStarterGrid}>
              <button
                type="button"
                className={styles.chatStarterBtn}
                onClick={() => handleSendChat('How can freshers in West Godavari find entry-level software or IT trainee jobs?')}
                disabled={isChatLoading}
              >
                💡 How do freshers find IT jobs in West Godavari?
              </button>
              <button
                type="button"
                className={styles.chatStarterBtn}
                onClick={() => handleSendChat('What projects can I build to stand out to employers in Bhimavaram and Eluru?')}
                disabled={isChatLoading}
              >
                🛠️ Stand-out project ideas for local employers
              </button>
              <button
                type="button"
                className={styles.chatStarterBtn}
                onClick={() => handleSendChat('How should I explain my final year college project in a technical interview?')}
                disabled={isChatLoading}
              >
                🎓 How to explain college projects in interviews
              </button>
              <button
                type="button"
                className={styles.chatStarterBtn}
                onClick={() => handleSendChat('What career opportunities exist in West Godavari for non-IT graduates?')}
                disabled={isChatLoading}
              >
                🏢 Career paths for non-IT graduates
              </button>
            </div>

            {/* Input Bar */}
            <form
              className={styles.chatInputBar}
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
            >
              <input
                type="text"
                id="chat-message-input"
                className={styles.chatInput}
                placeholder={t('ai.chatPlaceholder', 'Ask any career or interview question...')}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                maxLength={2000}
                disabled={isChatLoading}
              />
              <button
                type="submit"
                id="btn-send-chat"
                className={styles.sendBtn}
                disabled={isChatLoading || !chatInput.trim()}
              >
                {isChatLoading ? t('ai.analyzing', 'Thinking...') : `${t('ai.sendMessage', 'Send')} →`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOOL 2: RESUME & PROFILE REVIEW                                          */}
      {/* ========================================================================= */}
      {activeTool === 'resume' && (
        <div className={styles.mainCard}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC' }}>
              {t('ai.resumeTab', 'Resume & Candidate Profile Review')}
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#94A3B8' }}>
              Receive AI suggestions for your professional summary, ATS keywords, portfolio projects, and formatting.
            </p>
          </div>

          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <button
              type="button"
              className={`${styles.toolTabBtn} ${resumeMode === 'stored' ? styles.toolTabActive : ''}`}
              onClick={() => setResumeMode('stored')}
              style={{ padding: '0.6rem 1rem', fontSize: '0.84rem' }}
            >
              💼 {t('ai.resumeModeStored', 'Review Stored Profile')}
            </button>
            <button
              type="button"
              className={`${styles.toolTabBtn} ${resumeMode === 'custom' ? styles.toolTabActive : ''}`}
              onClick={() => setResumeMode('custom')}
              style={{ padding: '0.6rem 1rem', fontSize: '0.84rem' }}
            >
              ✍️ {t('ai.resumeModeCustom', 'Paste Custom Resume Draft')}
            </button>
          </div>

          {/* Database Notice if offline */}
          {dbNotice && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 8,
                padding: '1rem',
                color: '#FCD34D',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              <strong>Database Connection Notice:</strong> MongoDB Atlas is currently offline, so stored profile records cannot be retrieved automatically. Switch to <strong>"{t('ai.resumeModeCustom', 'Paste Custom Resume Draft')}"</strong> above to test AI analysis instantly!
            </div>
          )}

          {resumeMode === 'stored' ? (
            <div style={{ background: 'rgba(11, 16, 32, 0.5)', padding: '1.25rem', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <p style={{ fontSize: '0.88rem', color: '#CBD5E1', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                LocalHire will retrieve your saved candidate profile (headline, summary, skills, fresher status, and projects) and evaluate it against hiring standards.
              </p>
              <button
                type="button"
                id="btn-analyze-stored-profile"
                className={styles.primaryActionBtn}
                onClick={handleReviewProfile}
                disabled={isResumeLoading}
              >
                {isResumeLoading ? (
                  <>
                    <div className={styles.spinner} />
                    <span>{t('ai.reviewingProfile', 'Analyzing Stored Profile...')}</span>
                  </>
                ) : (
                  `${t('ai.reviewProfileBtn', 'Review My Profile with AI')} →`
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="custom-headline">
                  {t('ai.customHeadlineLabel', 'Headline / Career Goal')}
                </label>
                <input
                  type="text"
                  id="custom-headline"
                  className={styles.textInput}
                  placeholder={t('ai.customHeadlinePlaceholder', 'e.g., Aspiring Full Stack Developer | B.Tech CSE Graduate')}
                  value={customHeadline}
                  onChange={(e) => setCustomHeadline(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="custom-summary">
                  {t('ai.customSummaryLabel', 'Professional Summary')}
                </label>
                <textarea
                  id="custom-summary"
                  className={styles.textareaInput}
                  placeholder={t('ai.customSummaryPlaceholder', 'Paste your current resume summary or introductory paragraph...')}
                  value={customSummary}
                  onChange={(e) => setCustomSummary(e.target.value)}
                  maxLength={2000}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="custom-skills">
                  {t('ai.customSkillsLabel', 'Skills (comma-separated)')}
                </label>
                <input
                  type="text"
                  id="custom-skills"
                  className={styles.textInput}
                  placeholder={t('ai.customSkillsPlaceholder', 'e.g., JavaScript, React, Node.js, Express, MongoDB, Git')}
                  value={customSkills}
                  onChange={(e) => setCustomSkills(e.target.value)}
                />
              </div>

              <button
                type="button"
                id="btn-analyze-custom-profile"
                className={styles.primaryActionBtn}
                onClick={handleReviewProfile}
                disabled={isResumeLoading}
              >
                {isResumeLoading ? (
                  <>
                    <div className={styles.spinner} />
                    <span>{t('ai.reviewingProfile', 'Evaluating Resume Draft...')}</span>
                  </>
                ) : (
                  `${t('ai.reviewProfileBtn', 'Analyze Resume Draft')} →`
                )}
              </button>
            </div>
          )}

          {/* Results Output */}
          {resumeResult && (
            <div className={styles.resultCard} id="resume-analysis-results">
              <h3 className={styles.resultTitle}>
                <span>📋</span> {t('ai.resumeTab', 'AI Resume & Profile Review Findings')}
              </h3>
              <div className={styles.resultContent}>{resumeResult}</div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOOL 3: SKILL-GAP ANALYSIS                                               */}
      {/* ========================================================================= */}
      {activeTool === 'skillgap' && (
        <div className={styles.mainCard}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC' }}>
              {t('ai.skillGapTab', 'Skill-Gap & Career Learning Path Analysis')}
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#94A3B8' }}>
              Compare your current competencies against your target role or a specific job posting to discover missing skills and receive a 4-week learning roadmap.
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="target-role-input">
              {t('ai.targetRoleLabel', 'Target Role or Career Goal')} *
            </label>
            <input
              type="text"
              id="target-role-input"
              className={styles.textInput}
              placeholder={t('ai.targetRolePlaceholder', 'e.g., React Frontend Developer, Accounts Executive, QA Tester')}
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="current-skills-input">
              {t('ai.currentSkillsLabel', 'Your Current Skills (comma-separated)')} *
            </label>
            <input
              type="text"
              id="current-skills-input"
              className={styles.textInput}
              placeholder={t('ai.currentSkillsPlaceholder', 'e.g., HTML, CSS, JavaScript, Basic SQL, Excel')}
              value={currentSkillsInput}
              onChange={(e) => setCurrentSkillsInput(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="job-description-input">
              {t('ai.jobDescLabel', 'Optional Job Description / Employer Requirements')}
            </label>
            <span className={styles.formHelper}>
              Paste text from any job listing in West Godavari or elsewhere for hyper-targeted gap matching.
            </span>
            <textarea
              id="job-description-input"
              className={styles.textareaInput}
              placeholder={t('ai.jobDescPlaceholder', 'Paste job responsibilities and requirements...')}
              value={jobDescriptionInput}
              onChange={(e) => setJobDescriptionInput(e.target.value)}
              maxLength={4000}
            />
          </div>

          <button
            type="button"
            id="btn-analyze-skill-gap"
            className={styles.primaryActionBtn}
            onClick={handleAnalyzeSkillGap}
            disabled={isSkillGapLoading || !targetRole.trim()}
          >
            {isSkillGapLoading ? (
              <>
                <div className={styles.spinner} />
                <span>{t('ai.analyzingSkillGap', 'Generating Roadmap...')}</span>
              </>
            ) : (
              `${t('ai.analyzeSkillGapBtn', 'Perform Skill-Gap Analysis')} →`
            )}
          </button>

          {/* Results Output */}
          {skillGapResult && (
            <div className={styles.resultCard} id="skill-gap-results">
              <h3 className={styles.resultTitle}>
                <span>🎯</span> {t('ai.skillGapTab', 'Skill-Gap & Actionable Learning Roadmap')}
              </h3>
              <div className={styles.resultContent}>{skillGapResult}</div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOOL 4: INTERVIEW PREPARATION                                            */}
      {/* ========================================================================= */}
      {activeTool === 'interview' && (
        <div className={styles.mainCard}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC' }}>
              {t('ai.interviewTab', 'Interview Preparation & Feedback Studio')}
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#94A3B8' }}>
              Generate role-specific practice questions with STAR structures, or submit your answers for constructive AI critique.
            </p>
          </div>

          {/* Sub-Mode Selector */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`${styles.toolTabBtn} ${interviewMode === 'questions' ? styles.toolTabActive : ''}`}
              onClick={() => setInterviewMode('questions')}
              style={{ padding: '0.6rem 1rem', fontSize: '0.84rem' }}
            >
              ❓ {t('ai.questionsSubTab', '1. Generate Practice Questions')}
            </button>
            <button
              type="button"
              className={`${styles.toolTabBtn} ${interviewMode === 'feedback' ? styles.toolTabActive : ''}`}
              onClick={() => setInterviewMode('feedback')}
              style={{ padding: '0.6rem 1rem', fontSize: '0.84rem' }}
            >
              ✍️ {t('ai.feedbackSubTab', '2. Practice Answer Feedback')}
            </button>
          </div>

          {interviewMode === 'questions' ? (
            <div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="interview-role-input">
                  {t('ai.interviewRoleLabel', 'Target Job Role')} *
                </label>
                <input
                  type="text"
                  id="interview-role-input"
                  className={styles.textInput}
                  placeholder="e.g., React Trainee, Junior Python Developer, Bank Teller"
                  value={interviewRole}
                  onChange={(e) => setInterviewRole(e.target.value)}
                  maxLength={120}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="experience-level-select">
                  {t('ai.experienceLevelLabel', 'Candidate Experience Level')}
                </label>
                <select
                  id="experience-level-select"
                  className={styles.selectInput}
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                >
                  <option value="Fresher / Entry-Level">{t('ai.fresherLevel', 'Fresher / Entry-Level (0-1 Year)')}</option>
                  <option value="Junior (1-3 Years)">Junior (1-3 Years)</option>
                  <option value="Mid-Level (3-5 Years)">Mid-Level (3-5 Years)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="interview-job-desc">
                  {t('ai.jobDescLabel', 'Optional Job Description Context')}
                </label>
                <textarea
                  id="interview-job-desc"
                  className={styles.textareaInput}
                  placeholder={t('ai.jobDescPlaceholder', 'Paste job posting details if you want tailored questions for a specific company...')}
                  value={interviewJobDesc}
                  onChange={(e) => setInterviewJobDesc(e.target.value)}
                  maxLength={4000}
                />
              </div>

              <button
                type="button"
                id="btn-generate-questions"
                className={styles.primaryActionBtn}
                onClick={handleGenerateQuestions}
                disabled={isQuestionsLoading || !interviewRole.trim()}
              >
                {isQuestionsLoading ? (
                  <>
                    <div className={styles.spinner} />
                    <span>{t('ai.generatingQuestions', 'Generating Questions...')}</span>
                  </>
                ) : (
                  `${t('ai.generateQuestionsBtn', 'Generate Interview Questions')} →`
                )}
              </button>

              {questionsResult && (
                <div className={styles.resultCard} id="interview-questions-results">
                  <h3 className={styles.resultTitle}>
                    <span>🎙️</span> {t('ai.interviewTab', 'Practice Questions & Answer Strategies')}
                  </h3>
                  <div className={styles.resultContent}>{questionsResult}</div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="feedback-question-input">
                  {t('ai.questionToPracticeLabel', 'Interview Question')} *
                </label>
                <input
                  type="text"
                  id="feedback-question-input"
                  className={styles.textInput}
                  placeholder="e.g., Tell me about a time you faced a difficult deadline."
                  value={feedbackQuestion}
                  onChange={(e) => setFeedbackQuestion(e.target.value)}
                  maxLength={1000}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="practice-answer-input">
                  {t('ai.practiceAnswerLabel', 'Your Practice Answer')} *
                </label>
                <span className={styles.formHelper}>
                  Write your answer using the STAR method (Situation, Task, Action, Result) for best feedback.
                </span>
                <textarea
                  id="practice-answer-input"
                  className={styles.textareaInput}
                  placeholder={t('ai.practiceAnswerPlaceholder', 'Write your answer as you would speak it to the hiring manager...')}
                  value={practiceAnswer}
                  onChange={(e) => setPracticeAnswer(e.target.value)}
                  maxLength={4000}
                  style={{ minHeight: '140px' }}
                />
              </div>

              <button
                type="button"
                id="btn-evaluate-answer"
                className={styles.primaryActionBtn}
                onClick={handleProvideFeedback}
                disabled={isFeedbackLoading || !practiceAnswer.trim()}
              >
                {isFeedbackLoading ? (
                  <>
                    <div className={styles.spinner} />
                    <span>{t('ai.evaluatingAnswer', 'Evaluating Answer...')}</span>
                  </>
                ) : (
                  `${t('ai.evaluateAnswerBtn', 'Get Constructive Feedback')} →`
                )}
              </button>

              {feedbackResult && (
                <div className={styles.resultCard} id="interview-feedback-results">
                  <h3 className={styles.resultTitle}>
                    <span>📈</span> {t('ai.interviewTab', 'Answer Feedback & STAR Analysis')}
                  </h3>
                  <div className={styles.resultContent}>{feedbackResult}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
