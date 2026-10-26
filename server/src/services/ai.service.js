import { config } from '../config/env.js';
import { isDbConnected } from '../config/db.js';
import User from '../models/user.model.js';

export class AIServiceError extends Error {
  constructor(message, statusCode = 500, code = 'AI_SERVICE_ERROR') {
    super(message);
    this.name = 'AIServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// In-memory sliding window rate limiter: max 15 requests per minute per user
class UserRateLimiter {
  constructor(maxRequests = 15, windowMs = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  checkRateLimit(userId) {
    const key = String(userId);
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Filter timestamps within current window
    const recent = timestamps.filter((t) => now - t < this.windowMs);

    if (recent.length >= this.maxRequests) {
      return false;
    }

    recent.push(now);
    this.requests.set(key, recent);
    return true;
  }

  reset() {
    this.requests.clear();
  }
}

export const rateLimiter = new UserRateLimiter();

// Base System Instruction applied to all interactions
const SYSTEM_PROMPT = `You are LocalHire's AI Career Assistant, dedicated to empowering job seekers, students, and freshers across West Godavari district (Bhimavaram, Eluru, Tadepalligudem, Tanuku, Palakollu, Narasapuram) and Andhra Pradesh, India.
Guidelines:
1. Provide practical, supportive, culturally relevant, and actionable career advice for entry-level, fresher, and experienced job seekers.
2. Emphasize equal opportunity for freshers without penalizing lack of formal corporate work experience.
3. Suggest practical skills, learning resources, and portfolio project ideas.
4. Clearly communicate that all recommendations are informational AI suggestions and do not guarantee hiring or selection.
5. Never invent or hallucinate the user's personal experiences, credentials, or verified local job openings.
6. Keep formatting clean with concise bullet points and clear headings.`;

/**
 * Mock Handler for automated testing without external network or paid API calls
 */
let mockHandler = null;
let fetchOverride = null;

export function setFetchOverride(fn) {
  fetchOverride = fn;
}

export function clearFetchOverride() {
  fetchOverride = null;
}

/**
 * Check if HTTP status code represents a transient, retryable failure
 */
export function isRetryableStatus(status) {
  return status === 429 || status === 503 || (status >= 500 && status <= 599);
}

/**
 * Check if an Error represents a transient, retryable error
 */
export function isRetryableError(error) {
  if (!error) return false;
  if (error instanceof AIServiceError) {
    if (
      error.code === 'LLM_AUTH_FAILED' ||
      error.code === 'MODEL_NOT_FOUND' ||
      error.code === 'VALIDATION_ERROR' ||
      error.code === 'BAD_REQUEST' ||
      error.statusCode === 400 ||
      error.statusCode === 401 ||
      error.statusCode === 403 ||
      error.statusCode === 404
    ) {
      return false;
    }
    return isRetryableStatus(error.statusCode);
  }
  // Abort / Timeout errors should not be retried once timeout has passed
  if (error.name === 'TimeoutError' || error.name === 'AbortError' || error.code === 'ABORT_ERR') {
    return false;
  }
  // Transient network errors
  const msg = (error.message || '').toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket') ||
    msg.includes('network')
  );
}

/**
 * Calculate bounded exponential backoff with jitter
 * delay = min(maxDelayMs, baseDelayMs * 2^(attempt - 1)) + jitter
 */
export function calculateBackoff(attempt, baseDelayMs = 500, maxDelayMs = 3000, enableJitter = true) {
  const exponential = baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
  const capped = Math.min(maxDelayMs, exponential);
  const jitter = enableJitter ? Math.floor(Math.random() * (capped * 0.3)) : 0;
  return capped + jitter;
}

/**
 * Promise-based sleep that aborts immediately if AbortSignal fires
 */
export function sleep(ms, signal) {
  if (!ms || ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(signal.reason || new Error('Request aborted'));
    }
    const timer = setTimeout(() => {
      resolve();
    }, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason || new Error('Request aborted'));
      },
      { once: true }
    );
  });
}

/**
 * Sanitize and format conversation history for Gemini REST API
 * - Strips leading model/assistant messages so conversation begins with user
 * - Merges consecutive turns with identical roles to satisfy Gemini's alternating turn requirement
 * - Appends current prompt as user turn
 */
export function formatGeminiContents(history = [], prompt = '') {
  const rawItems = [];
  for (const item of history) {
    if (!item || !item.content) continue;
    const role = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';
    rawItems.push({ role, text: String(item.content).trim() });
  }
  if (prompt && String(prompt).trim()) {
    rawItems.push({ role: 'user', text: String(prompt).trim() });
  }

  // Gemini requires the conversation to begin with a 'user' turn
  while (rawItems.length > 0 && rawItems[0].role !== 'user') {
    rawItems.shift();
  }

  if (rawItems.length === 0 && prompt) {
    rawItems.push({ role: 'user', text: String(prompt).trim() });
  }

  // Merge consecutive turns with identical roles
  const merged = [];
  for (const item of rawItems) {
    if (merged.length > 0 && merged[merged.length - 1].role === item.role) {
      merged[merged.length - 1].text += '\n\n' + item.text;
    } else {
      merged.push({ role: item.role, text: item.text });
    }
  }

  return merged.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));
}

/**
 * Execute a provider request with bounded exponential-backoff retries
 */
export async function executeModelWithRetry(
  sendFn,
  { model, maxAttempts = 3, baseDelayMs = 500, maxDelayMs = 3000, timeoutSignal, deadline, onRetry }
) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const remainingMs = deadline ? deadline - Date.now() : 45000;
    if (timeoutSignal?.aborted || remainingMs <= 1000) {
      throw new AIServiceError('AI provider request timed out. Please try again.', 504, 'LLM_TIMEOUT');
    }

    try {
      return await sendFn(model, timeoutSignal);
    } catch (err) {
      lastError = err;

      if (
        err.name === 'TimeoutError' ||
        err.name === 'AbortError' ||
        err.code === 'ABORT_ERR' ||
        timeoutSignal?.aborted ||
        (deadline && Date.now() >= deadline)
      ) {
        throw new AIServiceError('AI provider request timed out. Please try again.', 504, 'LLM_TIMEOUT');
      }

      const retryable = isRetryableError(err);
      if (!retryable || attempt >= maxAttempts) {
        throw err;
      }

      const delay = calculateBackoff(attempt, baseDelayMs, maxDelayMs, true);
      if (onRetry) {
        onRetry({ attempt, maxAttempts, delay, error: err, model });
      }

      try {
        await sleep(delay, timeoutSignal);
      } catch {
        throw new AIServiceError('AI provider request timed out. Please try again.', 504, 'LLM_TIMEOUT');
      }
    }
  }

  throw lastError;
}

export const aiService = {
  /**
   * Set custom mock handler for isolated automated unit tests
   */
  setMockHandler(handler) {
    mockHandler = handler;
  },

  clearMockHandler() {
    mockHandler = null;
  },

  /**
   * Set custom fetch function override for transport-level tests
   */
  setFetchOverride(fn) {
    setFetchOverride(fn);
  },

  clearFetchOverride() {
    clearFetchOverride();
  },

  /**
   * Get safe AI configuration status without exposing secrets
   */
  getStatus() {
    const isConfigured = Boolean(config.llmApiKey) || mockHandler !== null;
    return {
      configured: isConfigured,
      provider: config.llmProvider,
      model: config.llmModel,
      fallbackModel: config.llmFallbackModel || null,
      maxRetries: config.llmMaxRetries || 3,
      notice: isConfigured
        ? 'AI Career Assistant service is active.'
        : 'LLM_API_KEY is not configured in server environment. Set LLM_API_KEY in server/.env to enable live AI features.',
    };
  },

  /**
   * Send single request to Google Gemini API
   */
  async sendGeminiRequest({ model, prompt, systemInstruction, history, timeoutSignal }) {
    const fetchFn = fetchOverride || globalThis.fetch;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(config.llmApiKey)}`;
    const contents = formatGeminiContents(history, prompt);

    const requestBody = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200,
      },
    };

    const response = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: timeoutSignal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const rawMsg = errData.error?.message || response.statusText;

      if (response.status === 401 || response.status === 403) {
        throw new AIServiceError('Invalid or unauthorized LLM_API_KEY.', 502, 'LLM_AUTH_FAILED');
      }
      if (response.status === 404) {
        throw new AIServiceError(`AI model "${model}" was not found or is unavailable.`, 404, 'MODEL_NOT_FOUND');
      }
      if (response.status === 429) {
        throw new AIServiceError('AI provider quota or rate limit exceeded. Please try again shortly.', 429, 'LLM_QUOTA_EXCEEDED');
      }
      if (response.status === 503) {
        throw new AIServiceError(
          `AI model "${model}" is currently experiencing high demand. Please try again in a moment.`,
          503,
          'LLM_OVERLOADED'
        );
      }
      throw new AIServiceError(`AI provider error (${response.status}): ${rawMsg}`, response.status >= 500 ? 503 : 502, 'LLM_PROVIDER_ERROR');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new AIServiceError('AI provider returned an empty response.', 502, 'EMPTY_AI_RESPONSE');
    }
    return text;
  },

  /**
   * Send single request to OpenAI-compatible API
   */
  async sendOpenAIRequest({ model, prompt, systemInstruction, history, timeoutSignal }) {
    const fetchFn = fetchOverride || globalThis.fetch;
    const url = config.llmApiUrl || 'https://api.openai.com/v1/chat/completions';
    const messages = [{ role: 'system', content: systemInstruction }];

    for (const item of history) {
      messages.push({
        role: item.role === 'assistant' ? 'assistant' : 'user',
        content: item.content,
      });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llmApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1200,
      }),
      signal: timeoutSignal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const rawMsg = errData.error?.message || response.statusText;

      if (response.status === 401 || response.status === 403) {
        throw new AIServiceError('Invalid or unauthorized LLM_API_KEY.', 502, 'LLM_AUTH_FAILED');
      }
      if (response.status === 404) {
        throw new AIServiceError(`AI model "${model}" was not found or is unavailable.`, 404, 'MODEL_NOT_FOUND');
      }
      if (response.status === 429) {
        throw new AIServiceError('AI provider quota or rate limit exceeded. Please try again shortly.', 429, 'LLM_QUOTA_EXCEEDED');
      }
      if (response.status === 503) {
        throw new AIServiceError(
          `AI model "${model}" is currently experiencing high demand. Please try again in a moment.`,
          503,
          'LLM_OVERLOADED'
        );
      }
      throw new AIServiceError(`AI provider error (${response.status}): ${rawMsg}`, response.status >= 500 ? 503 : 502, 'LLM_PROVIDER_ERROR');
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new AIServiceError('AI provider returned an empty response.', 502, 'EMPTY_AI_RESPONSE');
    }
    return text;
  },

  /**
   * Call the configured LLM provider with bounded exponential-backoff retries and verified model fallback
   */
  async callLLM({ prompt, systemInstruction = SYSTEM_PROMPT, history = [] }) {
    // 1. Check for test mock handler
    if (mockHandler) {
      return mockHandler({ prompt, systemInstruction, history });
    }

    // 2. Check provider configuration
    if (!config.llmApiKey) {
      throw new AIServiceError(
        'AI Career Assistant is not configured. Please set LLM_API_KEY in server/.env to enable live AI responses.',
        503,
        'LLM_NOT_CONFIGURED'
      );
    }

    const provider = (config.llmProvider || 'gemini').trim().toLowerCase();
    const primaryModel = (config.llmModel || 'gemini-3.8-flash').trim();
    const fallbackModel = (config.llmFallbackModel || (provider === 'gemini' ? 'gemini-3.5-flash' : '')).trim();
    const maxAttempts = Math.min(3, Math.max(1, config.llmMaxRetries || 3));
    const baseDelayMs = config.llmRetryDelayMs || 500;
    const timeoutMs = config.llmTimeoutMs || 45000;
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const deadline = Date.now() + timeoutMs;

    const sendFn = async (m, attemptSignal) => {
      const signal = attemptSignal || timeoutSignal;
      if (provider === 'gemini') {
        return this.sendGeminiRequest({ model: m, prompt, systemInstruction, history, timeoutSignal: signal });
      }
      return this.sendOpenAIRequest({ model: m, prompt, systemInstruction, history, timeoutSignal: signal });
    };

    try {
      // 3. Attempt primary model with bounded exponential backoff (max 3 total attempts)
      return await executeModelWithRetry(sendFn, {
        model: primaryModel,
        maxAttempts,
        baseDelayMs,
        maxDelayMs: 3000,
        timeoutSignal,
        deadline,
        onRetry: ({ attempt, delay, model }) => {
          console.warn(`[AI Career Assistant] Transient failure with model "${model}" on attempt ${attempt}/${maxAttempts}. Retrying in ${delay}ms...`);
        },
      });
    } catch (primaryErr) {
      // 4. Fall back to verified second model if primary experienced retryable failures (such as 503 high demand)
      const remainingForFallback = deadline - Date.now();
      const canFallback =
        Boolean(fallbackModel) &&
        fallbackModel !== primaryModel &&
        isRetryableError(primaryErr) &&
        !timeoutSignal.aborted &&
        remainingForFallback > 3000;

      if (canFallback) {
        console.warn(
          `[AI Career Assistant] Primary model "${primaryModel}" unavailable after retries (${primaryErr.message}). Attempting verified fallback model "${fallbackModel}"...`
        );

        try {
          return await executeModelWithRetry(sendFn, {
            model: fallbackModel,
            maxAttempts: 2,
            baseDelayMs: Math.max(250, Math.floor(baseDelayMs * 0.75)),
            maxDelayMs: 2000,
            timeoutSignal,
            deadline,
            onRetry: ({ attempt, delay, model }) => {
              console.warn(`[AI Career Assistant] Fallback model "${model}" retry ${attempt}...`);
            },
          });
        } catch (fallbackErr) {
          console.error(`[AI Career Assistant] Fallback model "${fallbackModel}" also failed: ${fallbackErr.message}`);
          throw fallbackErr;
        }
      }

      throw primaryErr;
    }
  },

  /**
   * 1. Interactive Career Chat
   */
  async chat({ message, history = [], userId }) {
    if (!rateLimiter.checkRateLimit(userId)) {
      throw new AIServiceError(
        'AI request limit exceeded. Please wait a moment before sending another message.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    const prompt = message;
    const responseText = await this.callLLM({ prompt, history });

    return {
      reply: responseText,
      disclaimer: 'AI recommendations are informational suggestions and should be reviewed before taking career actions.',
    };
  },

  /**
   * 2. Resume & Profile Improvement
   */
  async reviewProfile({ customProfile, userId }) {
    if (!rateLimiter.checkRateLimit(userId)) {
      throw new AIServiceError(
        'AI request limit exceeded. Please wait a moment before requesting another profile review.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    let profileToAnalyze = customProfile;

    // If custom draft is not provided, fetch stored profile from database
    if (!profileToAnalyze) {
      if (!isDbConnected() && !mockHandler) {
        throw new AIServiceError(
          'Personalized profile review requires an active MongoDB connection. You can still paste your summary or skills manually for instant AI analysis.',
          503,
          'DATABASE_UNAVAILABLE'
        );
      }

      const user = await User.findById(userId).select('-passwordHash');
      if (!user) {
        throw new AIServiceError('User profile not found.', 404, 'USER_NOT_FOUND');
      }

      const jp = user.jobseekerProfile || {};
      profileToAnalyze = {
        name: user.name,
        headline: jp.headline || '',
        summary: jp.summary || '',
        skills: jp.skills || [],
        isFresher: jp.isFresher ?? true,
        education: jp.education || [],
        projects: jp.projects || [],
        targetRole: jp.jobPreferences?.experienceLevel || 'Fresher / Entry-Level',
      };
    }

    const prompt = `Review the following candidate profile and provide constructive resume and profile improvements:
Candidate Profile Details:
- Target / Headline: ${profileToAnalyze.headline || 'Not specified'}
- Summary: ${profileToAnalyze.summary || 'None provided'}
- Skills: ${profileToAnalyze.skills?.length ? profileToAnalyze.skills.join(', ') : 'None listed'}
- Fresher Status: ${profileToAnalyze.isFresher ? 'Yes (Fresher / 0 years corporate experience)' : 'Experienced'}
- Projects: ${profileToAnalyze.projects?.length || 0} projects listed

Please format your response into 4 distinct sections:
1. 💡 Professional Summary Feedback (suggest an impactful 2-3 sentence revision)
2. 🎯 Skills Presentation & Keywords (recommendations for ATS readability)
3. 🚀 Portfolio & Project Suggestions (actionable ideas for entry-level candidates)
4. 📋 General Resume Enhancement Tips for West Godavari & Regional Hiring`;

    const reviewText = await this.callLLM({ prompt });

    return {
      review: reviewText,
      analyzedSections: {
        headline: Boolean(profileToAnalyze.headline),
        summary: Boolean(profileToAnalyze.summary),
        skillsCount: profileToAnalyze.skills?.length || 0,
      },
      disclaimer: 'AI profile suggestions do not guarantee recruiter selection. Review all advice before updating your public resume.',
    };
  },

  /**
   * 3. Skill-Gap & Career Guidance
   */
  async analyzeSkillGap({ targetRole, currentSkills = [], jobDescription = '', userId }) {
    if (!rateLimiter.checkRateLimit(userId)) {
      throw new AIServiceError(
        'AI request limit exceeded. Please wait a moment before requesting another skill-gap analysis.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    const prompt = `Perform a skill-gap analysis for a candidate aspiring to become a "${targetRole}".
Candidate's Current Skills: ${currentSkills.length ? currentSkills.join(', ') : 'None provided'}
${jobDescription ? `Target Job Description Requirements:\n${jobDescription}` : 'Target Role: Standard industry requirements in Andhra Pradesh'}

Please structure your analysis into:
1. 🌟 Matching & Transferable Skills (what the candidate already has)
2. ⚠️ Critical Skill Gaps (high-priority missing competencies)
3. 🗺️ 4-Week Learning Roadmap (week-by-week actionable study goals)
4. 🛠️ Recommended Portfolio Project (to demonstrate practical capability)
5. 💡 Beginner-Friendly Explanation of Requirements`;

    const analysisText = await this.callLLM({ prompt });

    return {
      targetRole,
      analysis: analysisText,
      disclaimer: 'Skill-gap insights are informational advisory suggestions representing general industry best practices.',
    };
  },

  /**
   * 4. Interview Preparation — Question Generation
   */
  async generateInterviewQuestions({ role, experienceLevel = 'Fresher / Entry-Level', category = '', jobDescription = '', userId }) {
    if (!rateLimiter.checkRateLimit(userId)) {
      throw new AIServiceError(
        'AI request limit exceeded. Please wait a moment before generating more interview questions.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    const prompt = `Generate realistic interview practice questions for the role: "${role}".
- Candidate Level: ${experienceLevel}
- Industry Category: ${category || 'General'}
${jobDescription ? `- Job Description Context: ${jobDescription}` : ''}

Generate 4-5 high-yield interview questions covering:
1. Technical / Domain knowledge
2. Problem-solving / Situational
3. Behavioral / Cultural fit
For each question, provide:
- The Question
- What the Interviewer is Assessing
- Sample Answer Strategy (using the STAR method: Situation, Task, Action, Result)`;

    const questionsText = await this.callLLM({ prompt });

    return {
      role,
      experienceLevel,
      questions: questionsText,
      disclaimer: 'Questions are generated for practice purposes and do not represent questions from any specific employer.',
    };
  },

  /**
   * 5. Interview Preparation — Answer Feedback
   */
  async provideInterviewFeedback({ question, answer, role = 'General Role', userId }) {
    if (!rateLimiter.checkRateLimit(userId)) {
      throw new AIServiceError(
        'AI request limit exceeded. Please wait a moment before submitting answer feedback.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    const prompt = `Evaluate the candidate's practice interview answer for the role "${role}".
Interview Question: "${question}"
Candidate's Answer: "${answer}"

Provide constructive feedback covering:
1. 🎯 Overall Rating & Impression (Encouraging, professional tone)
2. 💪 Strengths of the Answer
3. 📈 Key Areas for Improvement
4. 📐 STAR Structure Check (Was the Situation, Task, Action, Result clear?)
5. ✨ Polished Sample Phrasing (how to state it more effectively without changing facts)`;

    const feedbackText = await this.callLLM({ prompt });

    return {
      question,
      feedback: feedbackText,
      disclaimer: 'AI evaluation reflects communication structure and clarity; actual interview outcomes depend on employer criteria.',
    };
  },
};

export default aiService;
