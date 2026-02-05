import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartExportMenu } from './charts/ChartExportMenu';
import { Settings2 } from 'lucide-react';
import type { ServiceRecord } from '../types/data';

interface Props {
    data: ServiceRecord[];
    headers: string[];
}

export const CustomAnalysis: React.FC<Props> = ({ data, headers }) => {
    const [selectedColumn, setSelectedColumn] = useState<string>(headers[0] || '');
    const containerRef = React.useRef<HTMLDivElement>(null);

    const distributionData = useMemo(() => {
        if (!selectedColumn) return [];

        const counts = new Map<string, number>();
        data.forEach(record => {
            const val = record.raw[selectedColumn] || '(空)';
            counts.set(val, (counts.get(val) || 0) + 1);
        });

        return Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15); // Show top 15
    }, [data, selectedColumn]);

    if (headers.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative" ref={containerRef}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <Settings2 className="mr-2 text-blue-500" size={20} />
                        Custom Analysis (項目別詳細分析)
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">集計したい項目を自由に選択して可視化できます。</p>
                </div>
                <ChartExportMenu containerRef={containerRef as React.RefObject<HTMLDivElement>} title={`分析_${selectedColumn}`} />
            </div>

            <div className="mb-6 flex space-x-4 items-center">
                <label className="text-sm font-medium text-gray-700">分析項目:</label>
                <select
                    value={selectedColumn}
                    onChange={(e) => setSelectedColumn(e.target.value)}
                    className="flex-1 max-w-xs block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                >
                    {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                    ))}
                </select>
            </div>

            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#6366f1" name="件数" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 mt-4">※ 件数の多い順に上位15件を表示しています。</p>
        </div>
    );
};
