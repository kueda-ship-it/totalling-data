import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartExportMenu } from './ChartExportMenu';

interface Props {
    data: { name: string; count: number; percentage?: number }[];
}

export const PersonChart: React.FC<Props> = ({ data }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative" ref={containerRef}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Count by Person (対応者別件数)</h3>
                <ChartExportMenu containerRef={containerRef as React.RefObject<HTMLDivElement>} title="対応者別件数" />
            </div>
            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                        <Tooltip
                            formatter={(value: any, name: string | undefined, item: any) => {
                                if (name === "件数") {
                                    return [`${value}件 (${item.payload.percentage}%)`, name];
                                }
                                return [value, name || ""];
                            }}
                        />
                        <Legend />
                        <Bar dataKey="count" fill="#3b82f6" name="件数" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
