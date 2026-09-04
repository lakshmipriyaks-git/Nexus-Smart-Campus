import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    Printer,
    FileText,
    Clock,
    CheckCircle2,
    Loader2,
    Minus,
    Plus,
    Copy,
    Palette,
    FlipHorizontal,
    IndianRupee,
    Database,
    ListOrdered,
    Inbox,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { submitPrintJob, getStudentPrintJobs, seedCampusData } from '../services/campusUtilitiesService';
import { useAuth } from '../context/AuthContext';

// ─── Pricing constants ────────────────────────────────────────────────────────
const RATE = {
    bwSingle: 1,
    bwDouble: 0.75,
    colorSingle: 5,
    colorDouble: 4,
};

const computeCost = (pageCount, copies, isColor, doubleSided) => {
    const pagesPerSheet = doubleSided ? 2 : 1;
    const sheetsPerCopy = Math.ceil(pageCount / pagesPerSheet);
    const ratePerSheet = isColor
        ? doubleSided ? RATE.colorDouble : RATE.colorSingle
        : doubleSided ? RATE.bwDouble : RATE.bwSingle;
    return +(sheetsPerCopy * copies * ratePerSheet).toFixed(2);
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
    Queued: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    Printing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Ready: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    Completed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

const STATUS_ICONS = {
    Queued: <Clock className="w-3 h-3" />,
    Printing: <Loader2 className="w-3 h-3 animate-spin" />,
    Ready: <CheckCircle2 className="w-3 h-3" />,
    Completed: <CheckCircle2 className="w-3 h-3" />,
};

const StatusBadge = ({ status }) => (
    <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.Queued}`}
    >
        {STATUS_ICONS[status]}
        {status}
    </span>
);

// ─── Format timestamp ─────────────────────────────────────────────────────────
const formatTime = (ts) => {
    if (!ts) return '—';
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
    });
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PrintHubPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('new');

    // ── Form state ──
    const [fileName, setFileName] = useState('');
    const [pageCount, setPageCount] = useState(1);
    const [copies, setCopies] = useState(1);
    const [isColor, setIsColor] = useState(false);
    const [doubleSided, setDoubleSided] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // ── Queue state ──
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [seeding, setSeeding] = useState(false);

    // Derived cost
    const cost = computeCost(pageCount, copies, isColor, doubleSided);
    const rateLabel = isColor
        ? doubleSided ? `₹${RATE.colorDouble}/sheet (Color, Double-sided)`
            : `₹${RATE.colorSingle}/sheet (Color, Single-sided)`
        : doubleSided ? `₹${RATE.bwDouble}/sheet (B&W, Double-sided)`
            : `₹${RATE.bwSingle}/sheet (B&W, Single-sided)`;
    const sheetsPerCopy = Math.ceil(pageCount / (doubleSided ? 2 : 1));

    // ── Load queue when tab selected ──
    const fetchJobs = async () => {
        if (!user?.id) return;
        setLoadingJobs(true);
        try {
            const data = await getStudentPrintJobs(user.id);
            data.sort((a, b) => {
                const ta = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
                const tb = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
                return tb - ta;
            });
            setJobs(data);
        } catch (err) {
            toast.error('Failed to load print jobs.');
        } finally {
            setLoadingJobs(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'queue') fetchJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // ── Submit print job ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fileName.trim()) {
            toast.error('Please enter a file name.');
            return;
        }
        if (pageCount < 1) {
            toast.error('Page count must be at least 1.');
            return;
        }
        setSubmitting(true);
        try {
            await submitPrintJob({
                userId: user.id,
                userName: user.name,
                fileName: fileName.trim(),
                pageCount,
                copies,
                isColor,
                doubleSided,
                cost,
            });
            toast.success('🖨️ Print job submitted successfully!');
            setFileName('');
            setPageCount(1);
            setCopies(1);
            setIsColor(false);
            setDoubleSided(false);
            setActiveTab('queue');
        } catch (err) {
            toast.error('Failed to submit print job. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Seed demo data ──
    const handleSeed = async () => {
        setSeeding(true);
        try {
            await seedCampusData();
            toast.success('Demo data seeded successfully!');
            if (activeTab === 'queue') fetchJobs();
        } catch {
            toast.error('Failed to seed data.');
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20 p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
                            <Printer className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Print Hub</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Submit & track your print jobs</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSeed}
                        disabled={seeding}
                        className="self-start sm:self-auto"
                    >
                        <Database className="w-4 h-4" />
                        {seeding ? 'Seeding…' : 'Seed Demo Data'}
                    </Button>
                </div>

                {/* ── Tab bar ── */}
                <div className="flex gap-2 p-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm w-fit">
                    {[
                        { key: 'new', label: 'New Print Job', icon: <Printer className="w-4 h-4" /> },
                        { key: 'queue', label: 'My Print Queue', icon: <ListOrdered className="w-4 h-4" /> },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                activeTab === tab.key
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300 dark:shadow-indigo-900/60'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════
                    TAB: New Print Job
                ══════════════════════════════════════ */}
                {activeTab === 'new' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        {/* Form card */}
                        <div className="lg:col-span-3">
                            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 shadow-xl rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                                        <FileText className="w-5 h-5 text-indigo-500" />
                                        Print Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">

                                        {/* File name */}
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                File Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Lab_Report_Unit3.pdf"
                                                value={fileName}
                                                onChange={(e) => setFileName(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                            />
                                        </div>

                                        {/* Page count */}
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Number of Pages
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={pageCount}
                                                onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                            />
                                        </div>

                                        {/* Copies counter */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <Copy className="w-4 h-4 text-gray-400" />
                                                Copies
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setCopies((c) => Math.max(1, c - 1))}
                                                    className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-gray-700 dark:text-gray-200 flex items-center justify-center transition"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-10 text-center text-lg font-bold text-gray-900 dark:text-white">
                                                    {copies}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setCopies((c) => Math.min(50, c + 1))}
                                                    className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-gray-700 dark:text-gray-200 flex items-center justify-center transition"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* B&W vs Color toggle */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <Palette className="w-4 h-4 text-gray-400" />
                                                Print Mode
                                            </label>
                                            <div className="flex gap-2">
                                                {[
                                                    { value: false, label: 'B&W', hint: '₹0.75–₹1/sheet' },
                                                    { value: true, label: 'Color', hint: '₹4–₹5/sheet' },
                                                ].map((opt) => (
                                                    <button
                                                        key={String(opt.value)}
                                                        type="button"
                                                        onClick={() => setIsColor(opt.value)}
                                                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                                                            isColor === opt.value
                                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                                : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                        <span className="block text-xs font-normal opacity-70">{opt.hint}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Double-sided toggle */}
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <FlipHorizontal className="w-4 h-4 text-gray-400" />
                                                Sides
                                            </label>
                                            <div className="flex gap-2">
                                                {[
                                                    { value: false, label: 'Single-sided', hint: null },
                                                    { value: true, label: 'Double-sided', hint: 'saves paper & money' },
                                                ].map((opt) => (
                                                    <button
                                                        key={String(opt.value)}
                                                        type="button"
                                                        onClick={() => setDoubleSided(opt.value)}
                                                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                                                            doubleSided === opt.value
                                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                                : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                        {opt.hint && <span className="block text-xs font-normal opacity-70">{opt.hint}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Submit */}
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            className="w-full"
                                            disabled={submitting}
                                        >
                                            {submitting ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                                            ) : (
                                                <><Printer className="w-4 h-4" /> Submit Print Job</>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Cost estimator card */}
                        <div className="lg:col-span-2">
                            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 shadow-xl rounded-2xl sticky top-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                                        <IndianRupee className="w-5 h-5 text-indigo-500" />
                                        Cost Estimator
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">

                                        {/* Pricing table */}
                                        <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 text-sm">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Mode</th>
                                                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Rate</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {[
                                                        { label: 'B&W Single', rate: '₹1.00/sheet', active: !isColor && !doubleSided },
                                                        { label: 'B&W Double', rate: '₹0.75/sheet', active: !isColor && doubleSided },
                                                        { label: 'Color Single', rate: '₹5.00/sheet', active: isColor && !doubleSided },
                                                        { label: 'Color Double', rate: '₹4.00/sheet', active: isColor && doubleSided },
                                                    ].map((row) => (
                                                        <tr
                                                            key={row.label}
                                                            className={`transition-colors ${row.active ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                                        >
                                                            <td className={`px-3 py-2 ${row.active ? 'text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                {row.active && <span className="mr-1">→</span>}{row.label}
                                                            </td>
                                                            <td className={`px-3 py-2 text-right font-mono ${row.active ? 'text-indigo-700 dark:text-indigo-300 font-bold' : 'text-gray-500 dark:text-gray-500'}`}>
                                                                {row.rate}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Formula breakdown */}
                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 space-y-2.5 border border-indigo-100 dark:border-indigo-800/50">
                                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Breakdown</p>

                                            <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Pages</span>
                                                    <span className="font-medium">{pageCount}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Sheets/copy</span>
                                                    <span className="font-medium">{sheetsPerCopy}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Copies</span>
                                                    <span className="font-medium">× {copies}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Rate</span>
                                                    <span className="font-medium text-right text-xs leading-tight">{rateLabel}</span>
                                                </div>
                                            </div>

                                            <div className="h-px bg-indigo-200 dark:bg-indigo-700" />

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Total Cost</span>
                                                <span className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">
                                                    ₹{cost.toFixed(2)}
                                                </span>
                                            </div>

                                            <p className="text-xs text-indigo-500 dark:text-indigo-400 opacity-80">
                                                {sheetsPerCopy} sheets × {copies} copies × ₹{isColor ? (doubleSided ? RATE.colorDouble : RATE.colorSingle) : (doubleSided ? RATE.bwDouble : RATE.bwSingle)}/sheet = ₹{cost.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════
                    TAB: My Print Queue
                ══════════════════════════════════════ */}
                {activeTab === 'queue' && (
                    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 shadow-xl rounded-2xl">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                                    <ListOrdered className="w-5 h-5 text-indigo-500" />
                                    My Print Queue
                                </CardTitle>
                                <button
                                    onClick={fetchJobs}
                                    disabled={loadingJobs}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                                >
                                    {loadingJobs && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Refresh
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingJobs ? (
                                <SkeletonLoader rows={4} />
                            ) : jobs.length === 0 ? (
                                <EmptyState
                                    icon={Inbox}
                                    title="No print jobs yet"
                                    description="Submit a print job from the 'New Print Job' tab and it will appear here."
                                    action={
                                        <Button variant="primary" size="sm" onClick={() => setActiveTab('new')}>
                                            <Printer className="w-4 h-4" />
                                            Create Print Job
                                        </Button>
                                    }
                                />
                            ) : (
                                <div className="overflow-x-auto -mx-2">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-gray-700">
                                                {['File Name', 'Pages', 'Copies', 'Mode', 'Cost', 'Status', 'Time'].map((h) => (
                                                    <th
                                                        key={h}
                                                        className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap"
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                            {jobs.map((job) => (
                                                <tr
                                                    key={job.id}
                                                    className="hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors"
                                                >
                                                    {/* File name */}
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                                                                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                            </div>
                                                            <span className="font-medium text-gray-800 dark:text-gray-200 max-w-[160px] truncate" title={job.fileName}>
                                                                {job.fileName}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Pages */}
                                                    <td className="px-3 py-3 text-gray-600 dark:text-gray-400 font-mono">
                                                        {job.pageCount}
                                                    </td>

                                                    {/* Copies */}
                                                    <td className="px-3 py-3 text-gray-600 dark:text-gray-400 font-mono">
                                                        ×{job.copies}
                                                    </td>

                                                    {/* Mode */}
                                                    <td className="px-3 py-3">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold w-fit ${
                                                                job.isColor
                                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                            }`}>
                                                                {job.isColor ? <Palette className="w-3 h-3" /> : null}
                                                                {job.isColor ? 'Color' : 'B&W'}
                                                            </span>
                                                            {job.doubleSided && (
                                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold w-fit bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                                                                    <FlipHorizontal className="w-3 h-3" />
                                                                    2-sided
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Cost */}
                                                    <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-200 font-mono whitespace-nowrap">
                                                        ₹{Number(job.cost).toFixed(2)}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-3 py-3">
                                                        <StatusBadge status={job.status} />
                                                    </td>

                                                    {/* Time */}
                                                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                                                        {formatTime(job.timestamp)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
