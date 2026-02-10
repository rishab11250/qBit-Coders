import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useStudyStore = create(
    persist(
        (set, get) => ({
            // Content State
            pdfFile: null, // Files cannot be persisted easily in localStorage
            extractedText: '',
            notes: '',
            videoUrl: '',

            // Output State
            summary: '',
            topics: [],
            concepts: [],
            quiz: [],
            quiz: [],
            weakAreas: [],

            // Schedule State (Logic Domain)
            studySchedule: null, // { days: [ { day: string, tasks: [] } ] }

            // Chat State (Logic Domain)
            chatHistory: [], // Array of { role: 'user' | 'ai', content: string }
            isChatLoading: false,

            // UI State
            isLoading: false,
            error: null,
            currentStep: 'input', // input, analyzing, dashboard

            // Settings State
            settings: {
                apiKey: '',
                model: 'gemini-1.5-flash',
                difficulty: 'Intermediate',
                quizCount: 5
            },

            // Actions
            setPdfFile: (file) => set({ pdfFile: file }),
            setExtractedText: (text) => set({ extractedText: text }),
            setNotes: (notes) => set({ notes }),
            setVideoUrl: (url) => set({ videoUrl: url }),

            setStudyData: (data) => set({
                summary: data.summary || '',
                topics: data.topics || [],
                concepts: data.concepts || [],
                quiz: data.quiz || [],
                currentStep: 'dashboard', // Auto-switch to dashboard
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

            updateSettings: (newSettings) => set((state) => ({
                settings: { ...state.settings, ...newSettings }
            })),

            reset: () => set({
                pdfFile: null,
                extractedText: '',
                notes: '',
                videoUrl: '',
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
                summary: state.summary,
                topics: state.topics,
                concepts: state.concepts,
                quiz: state.quiz,
                weakAreas: state.weakAreas,
                studySchedule: state.studySchedule, // Persist schedule
                chatHistory: state.chatHistory, // Persist chat
                settings: state.settings,
                currentStep: state.currentStep
            }),
        }
    )
);

export default useStudyStore;
