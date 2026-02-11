import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Valid Gemini models as of 2026 (verified via ListModels API)
// Removed slow models: gemini-2.5-pro (thinking model), gemini-2.0-flash-001 (redundant)
const VALID_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];
const DEFAULT_MODEL = 'gemini-2.0-flash'; // Fastest stable model

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

            // [NEW] Study Plan History (persisted)
            planHistory: [], // { id, date, title, summary, topics, concepts, quiz, inputType }

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
            isChatOpen: false,
            isQuizLoading: false, // [NEW] Quiz Loading State

            // Settings State
            settings: {
                model: DEFAULT_MODEL,
                difficulty: 'Medium',
                quizCount: 20,
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
                studyMaterial: data.detailed_notes || [], // [FIX] Save detailed notes
                quiz: data.quiz || [],
                currentStep: 'dashboard',
                isLoading: false,
                error: null,
                isQuizLoading: false // Reset quiz loading on new data
            }),

            setQuizLoading: (loading) => set({ isQuizLoading: loading }),

            // Helper to update JUST the quiz (Stage 2)
            updateQuizData: (quizData) => set((state) => ({
                quiz: quizData,
                isQuizLoading: false
            })),

            addWeakArea: (topic) => {
                const state = get();
                if (state.weakAreas.includes(topic)) return;
                set({ weakAreas: [...state.weakAreas, topic] });
            },

            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
            setStep: (step) => set({ currentStep: step }),
            setIsChatOpen: (isOpen) => set({ isChatOpen: isOpen }),

            // Chat Actions
            addChatMessage: (message) => set((state) => ({
                chatHistory: [...state.chatHistory, message]
            })),

            // [NEW] Update the last AI message (for streaming)
            updateLastAiMessage: (content) => set((state) => {
                const newHistory = [...state.chatHistory];
                if (newHistory.length > 0) {
                    const lastMsg = newHistory[newHistory.length - 1];
                    if (lastMsg.role === 'ai' || lastMsg.role === 'model') {
                        lastMsg.content = content;
                    }
                }
                return { chatHistory: newHistory };
            }),

            setChatLoading: (isLoading) => set({ isChatLoading: isLoading }),

            setSchedule: (schedule) => set({ studySchedule: schedule }),
            setQuiz: (quiz) => set({ quiz }), // [NEW] Allow updating quiz specifically

            // Quiz History Actions
            addQuizResult: (result) => set((state) => ({
                quizHistory: [...state.quizHistory, { ...result, date: new Date().toISOString() }]
            })),

            // [NEW] Plan History Actions
            savePlanToHistory: (planData) => set((state) => {
                const newPlan = {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    title: planData.topics?.[0] || "Untitled Study Plan",
                    summary: planData.summary,
                    topics: planData.topics,
                    concepts: planData.concepts,
                    studyMaterial: planData.detailed_notes || planData.studyMaterial || [], // [FIX] Save notes
                    quiz: planData.quiz,
                    inputType: state.processedContent?.type || 'text'
                };
                // Keep last 10 plans
                const updatedHistory = [newPlan, ...state.planHistory].slice(0, 10);
                return { planHistory: updatedHistory };
            }),

            loadPlanFromHistory: (id) => {
                const state = get();
                const plan = state.planHistory.find(p => p.id === id);
                if (plan) {
                    set({
                        summary: plan.summary,
                        topics: plan.topics,
                        concepts: plan.concepts,
                        studyMaterial: plan.studyMaterial || [], // [FIX] Restore notes
                        quiz: plan.quiz,
                        currentStep: 'dashboard',
                        isLoading: false,
                        error: null
                    });
                }
            },

            deletePlanFromHistory: (id) => set((state) => ({
                planHistory: state.planHistory.filter(p => p.id !== id)
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
                studyMaterial: [], // [NEW] Deep dive notes
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
                // [FIX] Persist processed content BUT exclude heavy imageData to prevent localStorage quota exceeded
                processedContent: {
                    ...state.processedContent,
                    imageData: undefined // Don't persist chunks of base64 images
                },
                summary: state.summary,
                topics: state.topics,
                concepts: state.concepts,
                studyMaterial: state.studyMaterial, // [NEW] Persist deep dive notes
                quiz: state.quiz,
                weakAreas: state.weakAreas,
                quizHistory: state.quizHistory,
                planHistory: state.planHistory, // [NEW] Persist plan history
                studyStats: state.studyStats,
                studySchedule: state.studySchedule, // Persist schedule
                chatHistory: state.chatHistory, // Persist chat
                settings: state.settings,
                currentStep: state.currentStep
            }),
            version: 7, // Bump version: force model to gemini-2.0-flash
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
                if (version < 7) {
                    // Force model update: gemini-2.5-flash was too slow (thinking model)
                    persistedState = {
                        ...persistedState,
                        settings: {
                            ...persistedState?.settings,
                            model: 'gemini-2.0-flash'
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

