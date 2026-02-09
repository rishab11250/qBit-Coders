import { create } from 'zustand';

const useStudyStore = create((set) => ({
    // Content State
    pdfFile: null,
    extractedText: '',
    notes: '',
    videoUrl: '',

    // Output State
    summary: '',
    topics: [],
    concepts: [],
    quiz: [],
    weakAreas: [],

    // UI State
    isLoading: false,
    error: null,
    currentStep: 'input', // input, analyzing, dashboard

    // Settings State
    settings: {
        apiKey: localStorage.getItem('gemini_api_key') || '',
        model: localStorage.getItem('gemini_model') || 'gemini-1.5-flash',
        difficulty: 'Intermediate',
        quizCount: 5
    },

    // Actions
    setPdfFile: (file) => set({ pdfFile: file }),
    setExtractedText: (text) => set({ extractedText: text }),
    setNotes: (notes) => set({ notes }),
    setVideoUrl: (url) => set({ videoUrl: url }),

    setStudyData: (data) => set((state) => ({
        summary: data.summary || '',
        topics: data.topics || [],
        concepts: data.concepts || [],
        quiz: data.quiz || [],
        currentStep: 'dashboard',
        isLoading: false,
        error: null
    })),

    addWeakArea: (topic) => set((state) => {
        if (state.weakAreas.includes(topic)) return state;
        return { weakAreas: [...state.weakAreas, topic] };
    }),

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setStep: (step) => set({ currentStep: step }),

    updateSettings: (newSettings) => set((state) => {
        const updated = { ...state.settings, ...newSettings };
        localStorage.setItem('gemini_api_key', updated.apiKey);
        localStorage.setItem('gemini_model', updated.model);
        return { settings: updated };
    }),

    reset: () => set({
        pdfFile: null,
        extractedText: '',
        notes: '',
        videoUrl: '',
        summary: '',
        topics: [],
        concepts: [],
        quiz: [],
        currentStep: 'input',
        error: null
    })
}));

export default useStudyStore;
