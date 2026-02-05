import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartExportMenu } from './ChartExportMenu';

interface Props {
    data: { name: string; count: number; movingAverage?: number }[];
    title: string;
}

export const TrendChart: React.FC<Props> = ({ data, title }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative" ref={containerRef}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                <ChartExportMenu containerRef={containerRef as React.RefObject<HTMLDivElement>} title={title || 'Trend Chart'} />
            </div>
            <div className="h-[300px] w-full bg-gray-50 rounded-lg overflow-hidden">
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                formatter={(value: any, name: string | undefined) => {
                                    if (name === "移動平均") return [`${value}件`, name];
                                    return [`${value}件`, name || "件数"];
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#8884d8" name="件数" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            {data.some(d => d.movingAverage !== undefined) && (
                                <Line type="monotone" dataKey="movingAverage" stroke="#ff7300" name="移動平均" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-gray-400 text-sm">表示できるトレンドデータがありません</div>
                )}
            </div>
        </div>
    );
};
