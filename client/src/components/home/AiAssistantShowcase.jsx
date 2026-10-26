import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './AiAssistantShowcase.module.css';

export default function AiAssistantShowcase({ onShowToast }) {
  const { t } = useLanguage();
  const [activeTabId, setActiveTabId] = useState('resume');
  const [emailInput, setEmailInput] = useState('');

  const AI_CAPABILITIES = [
    {
      id: 'resume',
      tabName: t('aiShowcase.resumeTab', 'Resume Feedback & ATS'),
      icon: '📄',
      title: 'Automated Resume Optimization',
      description: 'Instant structural feedback and ATS keyword scoring tailored to specific job listings across Andhra Pradesh.',
      features: [
        'Identifies missing technical and soft skill keywords.',
        'Flags formatting issues that confuse automated screeners.',
        'Suggests high-impact action verbs and metric phrasing.',
        'Generates role-specific resume summary statements.'
      ],
      mockSample: {
        title: 'Sample Resume Health Report',
        metric: '86% Match Score',
        details: [
          '✓ Contact details & location verified (Bhimavaram)',
          '✓ Hard skills match 4 out of 5 required keywords',
          '⚠️ Add quantified accomplishments to Work Experience',
          '⚠️ Include Tally Prime certification in Skills section'
        ]
      }
    },
    {
      id: 'matching',
      tabName: t('aiShowcase.matchingTab', 'Intelligent Job Matching'),
      icon: '🎯',
      title: 'Smart Profile-to-Vacancy Matching',
      description: 'Vector-similarity matching between your verified profile competencies and local job requirements.',
      features: [
        'Eliminates irrelevant listings with semantic matching.',
        'Weights local location preferences (e.g. within 20km).',
        'Alerts you to hidden opportunities matching your background.',
        'Recommends salary ranges aligned with regional standards.'
      ],
      mockSample: {
        title: 'Top Candidate Matches',
        metric: '3 High Matches Found',
        details: [
          '⚡ 94% Match: Junior React Developer @ Godavari Digital',
          '⚡ 89% Match: Web UI Trainee @ Delta IoT Tadepalligudem',
          '⚡ 82% Match: Tech Support Associate @ Coastal Hub'
        ]
      }
    },
    {
      id: 'skillgap',
      tabName: t('aiShowcase.skillgapTab', 'Skill-Gap Roadmap'),
      icon: '🗺️',
      title: 'Personalized Career Skill Pathways',
      description: 'Pinpoints exactly what technical tools or certifications you need to bridge between your current resume and your dream job.',
      features: [
        'Compares your current skills with top regional hiring trends.',
        'Curates free and verified local certification programs.',
        'Provides week-by-week learning roadmaps.',
        'Suggests beginner-friendly portfolio projects.'
      ],
      mockSample: {
        title: 'Target Role: Full-Stack Developer',
        metric: 'Gap Analysis: 2 Skills Needed',
        details: [
          '✓ HTML5, CSS3, JavaScript (Mastered)',
          '✓ React.js & Component State (Proficient)',
          '⏳ Learn Express.js REST API Architecture (Est. 2 weeks)',
          '⏳ Build a MongoDB CRUD project (Est. 1 week)'
        ]
      }
    },
    {
      id: 'interview',
      tabName: t('aiShowcase.interviewTab', 'Mock Interview Simulator'),
      icon: '🎙️',
      title: 'Real-Time Interview Preparation',
      description: 'Practice answering tailored questions for regional employers with instant feedback on clarity, structure, and tone.',
      features: [
        'Custom role-specific technical and behavioral questions.',
        'Evaluates answers using the proven STAR framework.',
        'Provides sample model answers and improvement tips.',
        'Bilingual support planned for Telugu and English.'
      ],
      mockSample: {
        title: 'Practice Prompt: Banking Interview',
        metric: 'Question 1 of 5',
        details: [
          '"How do you handle an upset customer disputing a cash discrepancy at the counter?"',
          '💡 Tip: Acknowledge feelings, verify ledger voucher calmly, follow escalation SOP.'
        ]
      }
    }
  ];

  const currentCapability = AI_CAPABILITIES.find((c) => c.id === activeTabId) || AI_CAPABILITIES[0];

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      if (onShowToast) onShowToast(t('auth.valEmailValid', 'Please enter a valid email address.'), 'info');
      return;
    }
    if (onShowToast) {
      onShowToast(`Thank you! ${emailInput} added to the notifications list.`, 'success');
    }
    setEmailInput('');
  };

  return (
    <section className={styles.sectionWrapper} id="ai-assistant">
      <div className={styles.cardContainer}>
        {/* Header */}
        <div className={styles.headerRow}>
          <div className={styles.badge}>
            <span>⚡</span> {t('aiShowcase.badge', 'Intelligent Assistance')}
          </div>
          <h2 className={styles.title}>
            <span className={styles.titleHighlight}>{t('ai.title', 'AI Career Assistant')}</span>
          </h2>
          <p className={styles.subtitle}>
            {t('aiShowcase.subtitle', 'Built to level the playing field for tier-2/3 candidates across Andhra Pradesh with automated ATS optimization, smart matching, and mock interview practice.')}
          </p>
        </div>

        {/* Action Link to Live Assistant */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Link
            to="/student/ai-assistant"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              color: '#FFFFFF',
              padding: '0.75rem 1.6rem',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              boxShadow: '0 4px 18px rgba(124, 58, 237, 0.35)',
            }}
          >
            <span>⚡</span> {t('aiShowcase.launchBtn', 'Launch AI Career Assistant')} →
          </Link>
        </div>

        {/* Feature Tabs */}
        <div className={styles.tabList} role="tablist">
          {AI_CAPABILITIES.map((cap) => (
            <button
              key={cap.id}
              type="button"
              role="tab"
              aria-selected={activeTabId === cap.id}
              className={`${styles.tabBtn} ${activeTabId === cap.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTabId(cap.id)}
            >
              <span>{cap.icon}</span>
              <span>{cap.tabName}</span>
            </button>
          ))}
        </div>

        {/* Preview Box */}
        <div className={styles.previewBox}>
          {/* Left: Capability description */}
          <div className={styles.previewLeft}>
            <h3 className={styles.featureTitle}>
              <span>{currentCapability.icon}</span>
              <span>{currentCapability.title}</span>
            </h3>
            <p className={styles.featureDesc}>{currentCapability.description}</p>

            <ul className={styles.featureList}>
              {currentCapability.features.map((feat, idx) => (
                <li key={idx} className={styles.featureListItem}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Mock UI Output Card */}
          <div className={styles.mockUiCard}>
            <div className={styles.mockHeader}>
              <span style={{ fontWeight: 700, color: '#F8FAFC' }}>
                {currentCapability.mockSample.title}
              </span>
              <span className={styles.mockBadge}>
                {currentCapability.mockSample.metric}
              </span>
            </div>

            <div className={styles.mockContent}>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {currentCapability.mockSample.details.map((item, idx) => (
                  <li key={idx} style={{ color: '#E2E8F0', fontSize: '0.86rem', lineHeight: 1.5 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Early Access Waitlist */}
        <div className={styles.waitlistRow}>
          <div className={styles.waitlistText}>
            <strong>{t('ai.title', 'AI Career Assistant')} Updates</strong>
            <div>Receive email notifications when new regional career tools go live for West Godavari.</div>
          </div>

          <form className={styles.waitlistForm} onSubmit={handleWaitlistSubmit}>
            <input
              type="email"
              className={styles.waitlistInput}
              placeholder={t('auth.emailPlaceholder', 'Enter your email address...')}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              aria-label="Early access email"
            />
            <button type="submit" className={styles.waitlistBtn}>
              <span>{t('common.submit', 'Notify Me')}</span>
              <span>→</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
