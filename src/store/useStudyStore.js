import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Valid Gemini models as of 2026 (verified via ListModels API)
const VALID_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.0-flash-001'];
const DEFAULT_MODEL = 'gemini-2.5-flash';

const useStudyStore = create(
    persist(
        (set, get) => ({
            // Content State
            pdfFile: null,
            extractedText: '', // Legacy support
            notes: '',
            videoUrl: '',

            // [NEW] Structured Logic State (Daksh's Layer)
            processedContent: {
                type: null, // 'pdf' | 'video' | 'text'
                text: '',
                chunks: [], // { id, content, timestamp?, type }
                metadata: {}
            },

            // Output State
            summary: '',
            topics: [],
            concepts: [],
            quiz: [],
            weakAreas: [],

            // Quiz History (persisted)
            quizHistory: [], // { date, score, total, weakTopics: [], topicScores: {} }

            // Study Stats (persisted)
            studyStats: {
                totalPlansGenerated: 0,
                studyStreak: 0,
                lastStudyDate: null
            },

            // Pomodoro State (not persisted)
            pomodoroTopic: null,

            // Schedule State (Logic Domain)
            studySchedule: null, // { days: [ { day: string, tasks: [] } ] }

            // Chat State
            chatHistory: [], // Array of { role: 'user' | 'ai', content: string }
            isChatLoading: false,

            // UI State
            isLoading: false,
            error: null,
            currentStep: 'input',

            // Settings State
            settings: {
                model: DEFAULT_MODEL,
                difficulty: 'Medium',
                quizCount: 5,
                theme: 'dark', // Default theme
                // apiKey removed
            },

            // [NEW] Track Model Availability 
            // Structure: { 'gemini-2.5-flash': { status: 'available' | 'limited', availableAt: timestamp } }
            modelStatus: {},

            // Actions
            toggleTheme: () => set((state) => ({
                settings: { ...state.settings, theme: state.settings.theme === 'dark' ? 'light' : 'dark' }
            })),
            setPdfFile: (file) => set({ pdfFile: file }),
            setExtractedText: (text) => set({ extractedText: text }),
            setNotes: (notes) => set({ notes }),
            setVideoUrl: (url) => set({ videoUrl: url }),

            // [NEW] Action to store processed data
            setProcessedContent: (data) => set({ processedContent: data }),

            setStudyData: (data) => set({
                summary: data.summary || '',
                topics: data.topics || [],
                concepts: data.concepts || [],
                quiz: data.quiz || [],
                currentStep: 'dashboard',
                isLoading: false,
                error: null
            }),

            addWeakArea: (topic) => {
                const state = get();
                if (state.weakAreas.includes(topic)) return;
                set({ weakAreas: [...state.weakAreas, topic] });
            },

            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
            setStep: (step) => set({ currentStep: step }),

            // Chat Actions
            addChatMessage: (message) => set((state) => ({
                chatHistory: [...state.chatHistory, message]
            })),
            setChatLoading: (isLoading) => set({ isChatLoading: isLoading }),

            setSchedule: (schedule) => set({ studySchedule: schedule }),
            setQuiz: (quiz) => set({ quiz }), // [NEW] Allow updating quiz specifically

            // Quiz History Actions
            addQuizResult: (result) => set((state) => ({
                quizHistory: [...state.quizHistory, { ...result, date: new Date().toISOString() }]
            })),

            // Study Stats Actions
            incrementPlansGenerated: () => set((state) => {
                const today = new Date().toDateString();
                const lastDate = state.studyStats.lastStudyDate;
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                let streak = state.studyStats.studyStreak;
                if (lastDate === today) {
                    // Same day, no change
                } else if (lastDate === yesterday) {
                    streak += 1;
                } else {
                    streak = 1;
                }
                return {
                    studyStats: {
                        ...state.studyStats,
                        totalPlansGenerated: state.studyStats.totalPlansGenerated + 1,
                        studyStreak: streak,
                        lastStudyDate: today
                    }
                };
            }),

            // Pomodoro Actions
            setPomodoroTopic: (topic) => set({ pomodoroTopic: topic }),

            updateSettings: (newSettings) => set((state) => {
                // Validate model if being updated
                const updatedModel = newSettings.model || state.settings.model;
                const validModel = VALID_MODELS.includes(updatedModel) ? updatedModel : DEFAULT_MODEL;

                return {
                    settings: {
                        ...state.settings,
                        ...newSettings,
                        model: validModel
                    }
                };
            }),

            // [NEW] Update Model Availability Status
            updateModelStatus: (modelId, status, retryAfterMs = 0) => set((state) => ({
                modelStatus: {
                    ...state.modelStatus,
                    [modelId]: {
                        status,
                        availableAt: status === 'limited' ? Date.now() + retryAfterMs : null
                    }
                }
            })),

            reset: () => set({
                pdfFile: null,
                extractedText: '',
                notes: '',
                videoUrl: '',
                processedContent: {
                    type: null,
                    text: '',
                    chunks: [],
                    metadata: {}
                }, // [FIX] Reset processed content
                summary: '',
                topics: [],
                concepts: [],
                quiz: [],
                chatHistory: [],
                studySchedule: null,
                currentStep: 'input',
                error: null
            })
        }),
        {
            name: 'study-flow-storage', // unique name
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
            partialize: (state) => ({
                // Select which fields to persist
                // We DON'T persist pdfFile (it's a binary object)
                extractedText: state.extractedText,
                notes: state.notes,
                videoUrl: state.videoUrl,
                processedContent: state.processedContent, // [FIX] Persist processed content
                summary: state.summary,
                topics: state.topics,
                concepts: state.concepts,
                quiz: state.quiz,
                weakAreas: state.weakAreas,
                quizHistory: state.quizHistory,
                studyStats: state.studyStats,
                studySchedule: state.studySchedule, // Persist schedule
                chatHistory: state.chatHistory, // Persist chat
                settings: state.settings,
                currentStep: state.currentStep
            }),
            version: 5, // Bump version for quizHistory + studyStats
            migrate: (persistedState, version) => {
                if (version < 4) {
                    const currentModel = persistedState?.settings?.model;
                    const validModel = VALID_MODELS.includes(currentModel) ? currentModel : DEFAULT_MODEL;
                    persistedState = {
                        ...persistedState,
                        settings: {
                            ...persistedState?.settings,
                            model: validModel,
                            difficulty: persistedState?.settings?.difficulty || 'Intermediate',
                            quizCount: persistedState?.settings?.quizCount || 5,
                            theme: persistedState?.settings?.theme || 'dark'
                        }
                    };
                }
                if (version < 5) {
                    persistedState = {
                        ...persistedState,
                        quizHistory: persistedState?.quizHistory || [],
                        studyStats: persistedState?.studyStats || {
                            totalPlansGenerated: 0,
                            studyStreak: 0,
                            lastStudyDate: null
                        }
                    };
                }
                return persistedState;
            },
        }
    )
);

// Runtime validation on initialization
const validateSettings = () => {
    const state = useStudyStore.getState();
    if (!VALID_MODELS.includes(state.settings.model)) {
        console.warn(`⚠️ Invalid model "${state.settings.model}" detected. Resetting to ${DEFAULT_MODEL}`);
        useStudyStore.setState({
            settings: {
                ...state.settings,
                model: DEFAULT_MODEL
            }
        });
    }
};

// Run validation after store initialization
setTimeout(validateSettings, 0);

export default useStudyStore;

