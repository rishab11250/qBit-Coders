import React, { useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import useStudyStore from '../../store/useStudyStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const Settings = () => {
    const { settings, updateSettings } = useStudyStore();
    const [isOpen, setIsOpen] = useState(false);
    const [localSettings, setLocalSettings] = useState(settings);

    const handleOpen = () => {
        setLocalSettings(settings);
        setIsOpen(true);
    };

    const handleSave = () => {
        updateSettings(localSettings);
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className="p-2 text-secondary hover:text-primary hover:bg-white/10 rounded-full transition-colors"
                title="Settings"
            >
                <SettingsIcon size={20} />
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Application Settings">
                <div className="space-y-6">

                    {/* Model Selection */}
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">
                            AI Model
                        </label>
                        <select
                            value={localSettings.model}
                            onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-gray-500/30 text-primary rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                        >
                            <option value="gemini-2.5-flash" className="bg-slate-900 text-white">Gemini 2.5 Flash (Fast & Balanced)</option>
                            <option value="gemini-2.0-flash" className="bg-slate-900 text-white">Gemini 2.0 Flash (Stable)</option>
                            <option value="gemini-2.5-pro" className="bg-slate-900 text-white">Gemini 2.5 Pro (Smartest)</option>
                            <option value="gemini-2.0-flash-001" className="bg-slate-900 text-white">Gemini 2.0 Flash 001 (Pinned)</option>
                        </select>
                    </div>

                    {/* Quiz Preferences */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">
                                Quiz Questions
                            </label>
                            <input
                                type="number"
                                min="1" max="20"
                                value={localSettings.quizCount}
                                onChange={(e) => setLocalSettings({ ...localSettings, quizCount: parseInt(e.target.value) || 5 })}
                                className="w-full px-3 py-2 bg-transparent border border-gray-500/30 text-primary rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">
                                Difficulty
                            </label>
                            <select
                                value={localSettings.difficulty}
                                onChange={(e) => setLocalSettings({ ...localSettings, difficulty: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-gray-500/30 text-primary rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                            >
                                <option value="Beginner" className="bg-slate-900 text-white">Beginner</option>
                                <option value="Intermediate" className="bg-slate-900 text-white">Intermediate</option>
                                <option value="Advanced" className="bg-slate-900 text-white">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>
                            <Save size={16} className="mr-2" /> Save Settings
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Settings;
