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
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                title="Settings"
            >
                <SettingsIcon size={20} />
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Application Settings">
                <div className="space-y-6">

                    {/* API Key Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gemini API Key
                        </label>
                        <input
                            type="password"
                            value={localSettings.apiKey}
                            onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                            placeholder="Enter your Gemini API Key"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Your key is stored locally in your browser. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Google AI Studio</a>.
                        </p>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            AI Model
                        </label>
                        <select
                            value={localSettings.model}
                            onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Faster)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (More Capable)</option>
                        </select>
                    </div>

                    {/* Quiz Preferences */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quiz Questions
                            </label>
                            <input
                                type="number"
                                min="1" max="20"
                                value={localSettings.quizCount}
                                onChange={(e) => setLocalSettings({ ...localSettings, quizCount: parseInt(e.target.value) || 5 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Difficulty
                            </label>
                            <select
                                value={localSettings.difficulty}
                                onChange={(e) => setLocalSettings({ ...localSettings, difficulty: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
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
