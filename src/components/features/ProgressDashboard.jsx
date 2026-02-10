import React, { useRef } from 'react';
import { BarChart3, TrendingUp, Trophy, Flame, Target } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import useStudyStore from '../../store/useStudyStore';

const ProgressDashboard = () => {
    const { quizHistory, studyStats, weakAreas } = useStudyStore();
    const containerRef = useRef(null);

    useGSAP(() => {
        gsap.from('.progress-card', {
            y: 30, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out'
        });
    }, { scope: containerRef });

    // Prepare chart data from quiz history
    const scoreData = quizHistory.map((q, i) => ({
        name: new Date(q.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.round((q.score / q.total) * 100),
        raw: `${q.score}/${q.total}`
    }));

    // Topic performance from all quizzes
    const topicMap = {};
    quizHistory.forEach(q => {
        if (q.topicScores) {
            Object.entries(q.topicScores).forEach(([topic, data]) => {
                if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
                topicMap[topic].correct += data.correct;
                topicMap[topic].total += data.total;
            });
        }
    });

    const topicData = Object.entries(topicMap)
        .map(([topic, data]) => ({
            name: topic.length > 15 ? topic.substring(0, 15) + '…' : topic,
            fullName: topic,
            score: Math.round((data.correct / data.total) * 100),
            correct: data.correct,
            total: data.total
        }))
        .sort((a, b) => a.score - b.score);

    const avgScore = quizHistory.length > 0
        ? Math.round(quizHistory.reduce((sum, q) => sum + (q.score / q.total) * 100, 0) / quizHistory.length)
        : 0;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
                    <p className="text-primary font-medium">{label}</p>
                    <p className="text-violet-400">{payload[0].value}%</p>
                </div>
            );
        }
        return null;
    };

    const TopicTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
                    <p className="text-primary font-medium">{d.fullName}</p>
                    <p className="text-violet-400">{d.correct}/{d.total} correct ({d.score}%)</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div ref={containerRef} className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Plans Generated', value: studyStats.totalPlansGenerated, unit: null, icon: Target, iconColor: 'text-violet-400', iconBg: 'bg-violet-500/10', glow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.35)]', scale: 'hover:scale-[1.02]', valueColor: 'text-primary', labelColor: 'text-secondary' },
                    { label: 'Quizzes Taken', value: quizHistory.length, unit: null, icon: Trophy, iconColor: 'text-amber-400', iconBg: 'bg-amber-500/10', glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]', scale: 'hover:scale-[1.02]', valueColor: 'text-primary', labelColor: 'text-secondary' },
                    { label: 'Avg Score', value: avgScore, unit: '%', icon: TrendingUp, iconColor: 'text-teal-400', iconBg: 'bg-teal-500/10', glow: 'hover:shadow-[0_0_20px_rgba(20,184,166,0.35)]', scale: 'hover:scale-[1.02]', valueColor: 'text-primary', labelColor: 'text-secondary' },
                    { label: 'Study Streak', value: studyStats.studyStreak, unit: studyStats.studyStreak === 1 ? 'day' : 'days', icon: Flame, iconColor: 'text-rose-400', iconBg: 'bg-rose-500/20', glow: 'hover:shadow-[0_0_25px_rgba(244,63,94,0.45)]', scale: 'hover:scale-[1.03]', valueColor: '!text-white', labelColor: '!text-white/70', extraClass: '!opacity-100' }
                ].map((stat, i) => (
                    <div key={i} className={`progress-card rounded-2xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-300 hover:brightness-110 hover:shadow-lg ${stat.glow} ${stat.scale} ${stat.extraClass || ''} group`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon size={24} className={stat.iconColor} />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${stat.labelColor}`}>{stat.label}</span>
                        </div>
                        <div className="h-10 flex items-end">
                            <span className={`text-3xl font-bold leading-none tracking-tight ${stat.valueColor}`}>{stat.value}</span>
                            {stat.unit && <span className={`text-sm ml-1 opacity-70 ${stat.valueColor}`}>{stat.unit}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts or Empty State */}
            {quizHistory.length === 0 && studyStats.totalPlansGenerated === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                        <BarChart3 size={28} className="text-secondary" />
                    </div>
                    <h4 className="text-lg font-semibold text-primary mb-2">No Progress Yet</h4>
                    <p className="text-secondary text-sm">Complete quizzes and generate study plans to start tracking your progress.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Score Over Time */}
                    {quizHistory.length > 0 && (
                        <div className="progress-card rounded-2xl bg-[var(--bg-secondary)] border border-primary/5 p-5">
                            <h4 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-4">Quiz Scores Over Time</h4>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={scoreData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a0a0a0' }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#a0a0a0' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone" dataKey="score"
                                        stroke="#8b5cf6" strokeWidth={2.5}
                                        dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }}
                                        activeDot={{ r: 6, fill: '#a78bfa' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Topic Performance */}
                    {topicData.length > 0 && (
                        <div className="progress-card rounded-2xl bg-[var(--bg-secondary)] border border-primary/5 p-5">
                            <h4 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-4">Topic Performance</h4>
                            <div className="topic-chart-container group/chart">
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={topicData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#a0a0a0' }} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#a0a0a0', fontWeight: 500 }} axisLine={false} tickLine={false} width={100} />
                                        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                                            {topicData.map((entry, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={entry.score >= 70 ? '#14b8a6' : entry.score >= 40 ? '#f59e0b' : '#f43f5e'}
                                                    className="transition-all duration-300 ease-out origin-left hover:brightness-125 hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] hover:scale-x-105 group-hover/chart:opacity-40 hover:!opacity-100"
                                                    style={{ transformBox: 'fill-box' }}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProgressDashboard;
