import React, { useState, useMemo, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { PersonChart } from './charts/PersonChart';
import { TrendChart } from './charts/TrendChart';
import { DataTable } from './DataTable';
import { ChartExportMenu } from './charts/ChartExportMenu';
import { parseCSV } from '../lib/parser';
import { calculateStatistics } from '../lib/statistics';
import { listDatasets, loadDataset, saveDataset, deleteDataset, type DatasetMetadata } from '../lib/storage';
import { CustomAnalysis } from './CustomAnalysis';
import { Clock, Trash2, Database, BarChart2, Table } from 'lucide-react';
import type { ServiceRecord } from '../types/data';

export const Dashboard: React.FC = () => {
    const [data, setData] = useState<ServiceRecord[]>([]);
    const [timeScale, setTimeScale] = useState<'year' | 'month' | 'week'>('month');
    const [showTable, setShowTable] = useState(false);
    const [savedDatasets, setSavedDatasets] = useState<DatasetMetadata[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const dayOfWeekRef = React.useRef<HTMLDivElement>(null);
    const performanceRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        refreshDatasetList();
    }, []);

    const refreshDatasetList = async () => {
        try {
            const list = await listDatasets();
            setSavedDatasets(list.sort((a, b) => b.timestamp - a.timestamp));
        } catch (err) {
            console.error('Failed to load saved datasets', err);
        }
    };

    const handleFileUpload = async (content: string, filename?: string) => {
        setIsProcessing(true);
        try {
            const parsedData = parseCSV(content);
            setData(parsedData);

            // Auto-save to IndexedDB
            const name = filename || `Upload ${new Date().toLocaleString()}`;
            await saveDataset(name, parsedData);
            await refreshDatasetList();
        } catch (err) {
            console.error('Failed to process upload', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSelectSaved = async (id: number) => {
        setIsProcessing(true);
        try {
            const result = await loadDataset(id);
            if (result) {
                setData(result.data);
            }
        } catch (err) {
            console.error('Failed to load dataset', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteSaved = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('このデータを削除しますか？')) return;

        try {
            await deleteDataset(id);
            await refreshDatasetList();
        } catch (err) {
            console.error('Failed to delete dataset', err);
        }
    };

    const stats = useMemo(() => {
        const s = calculateStatistics(data);
        console.log('Statistics calculated:', {
            total: data.length,
            byYear: s.byYear.length,
            byMonth: s.byMonth.length,
            byWeek: s.byWeek.length
        });
        return s;
    }, [data]);

    const trendData = useMemo(() => {
        if (timeScale === 'year') return stats.byYear;
        if (timeScale === 'week') return stats.byWeek;
        return stats.byMonth;
    }, [stats, timeScale]);

    const trendTitle = useMemo(() => {
        if (timeScale === 'year') return 'Yearly Trend (年次推移)';
        if (timeScale === 'week') return 'Weekly Trend (週次推移)';
        return 'Monthly Trend (月次推移)';
    }, [timeScale]);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Log Analysis Dashboard</h1>
                    <p className="text-gray-600 mt-2">Upload or select previous access log CSV to visualize trends.</p>
                </div>
                {data.length > 0 && (
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setShowTable(!showTable)}
                            className="flex items-center px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                        >
                            {showTable ? (
                                <><BarChart2 size={18} className="mr-2" /> Show Charts</>
                            ) : (
                                <><Table size={18} className="mr-2" /> Show Data Table</>
                            )}
                        </button>
                        <button
                            onClick={() => { setData([]); setShowTable(false); }}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                        >
                            Select Other Data
                        </button>
                    </div>
                )}
            </header>

            {data.length === 0 ? (
                <div className="max-w-4xl mx-auto space-y-12 mt-12">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
                            <Database className="mr-2 text-blue-500" size={24} />
                            新規アップロード
                        </h2>
                        {isProcessing ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                                <p className="text-gray-600">ファイルを処理中...</p>
                            </div>
                        ) : (
                            <FileUpload onFileUpload={handleFileUpload} />
                        )}
                    </div>

                    {savedDatasets.length > 0 && (
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
                                <Clock className="mr-2 text-indigo-500" size={24} />
                                過去のデータを選択
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {savedDatasets.map((ds) => (
                                    <div
                                        key={ds.id}
                                        onClick={() => handleSelectSaved(ds.id)}
                                        className="group p-4 border border-gray-100 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer relative"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 truncate pr-8">{ds.name}</h4>
                                                <div className="mt-1 flex items-center text-xs text-gray-500 space-x-3">
                                                    <span>{new Date(ds.timestamp).toLocaleDateString()}</span>
                                                    <span>{ds.recordCount.toLocaleString()} 件</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteSaved(e, ds.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                title="削除"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {!showTable ? (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <PersonChart data={stats.byPerson} />
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative" ref={dayOfWeekRef}>
                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800">Day of Week (曜日別)</h3>
                                        <ChartExportMenu containerRef={dayOfWeekRef as React.RefObject<HTMLDivElement>} title="曜日別集計" />
                                    </div>
                                    <div className="space-y-4">
                                        {stats.byDayOfWeek.map((day) => (
                                            <div key={day.name} className="flex items-center">
                                                <span className="w-8 text-sm font-medium text-gray-600">{day.name}</span>
                                                <div className="flex-1 ml-4 bg-gray-100 h-4 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-indigo-500 h-full rounded-full"
                                                        style={{ width: `${(day.count / Math.max(...stats.byDayOfWeek.map(d => d.count))) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="ml-4 text-sm text-gray-500 tabular-nums">{day.count.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800">{trendTitle}</h3>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        {(['year', 'month', 'week'] as const).map((scale) => (
                                            <button
                                                key={scale}
                                                onClick={() => setTimeScale(scale)}
                                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${timeScale === scale
                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                {scale === 'year' ? 'Yearly' : scale === 'month' ? 'Monthly' : 'Weekly'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <TrendChart data={trendData} title="" />
                                <p className="text-xs text-gray-400 mt-2">※ Orange dotted line represents Simple Moving Average (SMA).</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <TrendChart data={stats.byIssueCategory} title="Failure Classification (障害区分別)" />
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative" ref={performanceRef}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Responder Performance (対応者別平均作業時間)</h3>
                                        <ChartExportMenu containerRef={performanceRef as React.RefObject<HTMLDivElement>} title="対応者別パフォーマンス" />
                                    </div>
                                    <div className="overflow-y-auto max-h-[300px] pr-2">
                                        <table className="min-w-full">
                                            <thead className="sticky top-0 bg-white">
                                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                                                    <th className="pb-2">対応者</th>
                                                    <th className="pb-2 text-right">平均時間(分)</th>
                                                    <th className="pb-2 text-right">件数</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {stats.personPerformance.map((p) => (
                                                    <tr key={p.name} className="text-sm">
                                                        <td className="py-2 text-gray-900 font-medium">{p.name}</td>
                                                        <td className="py-2 text-right text-gray-600 tabular-nums">{p.avgDuration}</td>
                                                        <td className="py-2 text-right text-gray-500 tabular-nums">{p.totalCount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-4">※ Counts represent records with valid duration. Only members with 100+ records shown.</p>
                                </div>
                            </div>

                            <CustomAnalysis data={data} headers={stats.headers} />
                        </>
                    ) : (
                        <DataTable data={data} />
                    )}
                </div>
            )}
        </div>
    );
};
