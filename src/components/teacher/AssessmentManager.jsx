import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { BookOpen, Plus, Trash2, Edit } from 'lucide-react';

import EmptyState from '../ui/EmptyState';

export default function AssessmentManager({ courseId, courseName }) {
    const { assessments, createAssessment, deleteAssessment } = useData();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'internal',
        maxMarks: '',
        modulesCovered: ''
    });

    const courseAssessments = assessments.filter(a => a.courseId === courseId);

    const handleSubmit = async (e) => {
        e.preventDefault();

        await createAssessment({
            courseId,
            courseName,
            name: formData.name,
            type: formData.type,
            maxMarks: Number(formData.maxMarks),
            modulesCovered: formData.modulesCovered.split(',').map(m => m.trim()),
        });

        // Reset form
        setFormData({
            name: '',
            type: 'internal',
            maxMarks: '',
            modulesCovered: ''
        });
        setShowForm(false);
    };

    const handleDelete = async (assessmentId) => {
        if (confirm('Delete this assessment and all associated grades?')) {
            await deleteAssessment(assessmentId);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                        Assessments for {courseName}
                    </CardTitle>
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        size="sm"
                        className="bg-indigo-600 text-white"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Assessment
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {showForm && (
                    <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4 backdrop-blur-sm animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Assessment Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    placeholder="e.g., Internal Test 1"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Type *
                                </label>
                                <select
                                    className="input-field"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="internal">Internal Test</option>
                                    <option value="external">External Exam</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Maximum Marks *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    className="input-field"
                                    placeholder="e.g., 50"
                                    value={formData.maxMarks}
                                    onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Modules Covered
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g., Module 1, Module 2"
                                    value={formData.modulesCovered}
                                    onChange={(e) => setFormData({ ...formData, modulesCovered: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate modules with commas</p>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button type="submit" className="btn-primary">
                                Create Assessment
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowForm(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                {courseAssessments.length === 0 ? (
                    <EmptyState
                        icon={BookOpen}
                        title="No Assessments"
                        description="No assessments created yet. Click 'Add Assessment' to create one."
                        className="py-8 border-none bg-transparent"
                    />
                ) : (
                    <div className="space-y-3">
                        {courseAssessments.map((assessment) => (
                            <div
                                key={assessment.id}
                                className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200 backdrop-blur-sm"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{assessment.name}</h4>
                                        <span className={`px-2 py-1 text-xs rounded-full ${assessment.type === 'internal'
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                            }`}>
                                            {assessment.type === 'internal' ? 'Internal' : 'External'}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span>Max Marks: <strong className="text-gray-900 dark:text-gray-200">{assessment.maxMarks}</strong></span>
                                        {assessment.modulesCovered && assessment.modulesCovered.length > 0 && (
                                            <span>Modules: {assessment.modulesCovered.join(', ')}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(assessment.id)}
                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete assessment"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
