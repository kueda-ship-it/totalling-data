import React, { useState, useMemo } from 'react';
import { FileUpload } from './FileUpload';
import { PersonChart } from './charts/PersonChart';
import { TrendChart } from './charts/TrendChart';
import { DataTable } from './DataTable';
import { ChartExportMenu } from './charts/ChartExportMenu';
import { parseCSV } from '../lib/parser';
import { calculateStatistics } from '../lib/statistics';
import type { ServiceRecord } from '../types/data';

export const Dashboard: React.FC = () => {
    const [data, setData] = useState<ServiceRecord[]>([]);
    const [timeScale, setTimeScale] = useState<'year' | 'month' | 'week'>('month');
    const [showTable, setShowTable] = useState(false);
    const dayOfWeekRef = React.useRef<HTMLDivElement>(null);
    const performanceRef = React.useRef<HTMLDivElement>(null);

    const handleFileUpload = (content: string) => {
        const parsedData = parseCSV(content);
        setData(parsedData);
    };

    const stats = useMemo(() => calculateStatistics(data), [data]);

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
                    <p className="text-gray-600 mt-2">Upload your access log CSV to visualize trends.</p>
                </div>
                {data.length > 0 && (
                    <button
                        onClick={() => setShowTable(!showTable)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                        {showTable ? 'Show Charts' : 'Show Data Table'}
                    </button>
                )}
            </header>

            {data.length === 0 ? (
                <div className="max-w-xl mx-auto mt-20">
                    <FileUpload onFileUpload={handleFileUpload} />
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex space-x-8">
                            <div>
                                <span className="text-gray-500 text-sm">Total Records:</span>
                                <span className="ml-2 text-2xl font-bold text-blue-600">{data.length.toLocaleString()}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setData([])}
                            className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 hover:bg-red-50 rounded"
                        >
                            Reset Data
                        </button>
                    </div>

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
                        </>
                    ) : (
                        <DataTable data={data} />
                    )}
                </div>
            )}
        </div>
    );
};
