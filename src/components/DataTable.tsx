import React, { useState } from 'react';
import type { ServiceRecord } from '../types/data';

interface Props {
    data: ServiceRecord[];
}

export const DataTable: React.FC<Props> = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30; // Increased slightly for better density

    // Debounce search term to avoid filtering 100k+ records on every keystroke
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 400); // 400ms delay
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const filteredData = React.useMemo(() => {
        if (!debouncedSearchTerm) return data;
        const lowerSearch = debouncedSearchTerm.toLowerCase();
        return data.filter(record => {
            // Only search specific important fields to speed up
            return (
                record.buildingName.toLowerCase().includes(lowerSearch) ||
                record.person.toLowerCase().includes(lowerSearch) ||
                record.issueDetails.toLowerCase().includes(lowerSearch) ||
                record.issueCategory.toLowerCase().includes(lowerSearch)
            );
        });
    }, [data, debouncedSearchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = React.useMemo(() =>
        filteredData.slice(startIndex, startIndex + itemsPerPage),
        [filteredData, startIndex]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Raw Data (データ一覧)</h3>
                    {searchTerm !== debouncedSearchTerm && (
                        <span className="text-xs text-blue-500 animate-pulse">Filtering...</span>
                    )}
                </div>
                <input
                    type="text"
                    placeholder="物件名、対応者、内容で検索..."
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-80"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto border rounded-xl">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物件名</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">対応日</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">対応者</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">障害内容</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間(分)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedData.map((record: ServiceRecord, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-900 truncate max-w-[200px]">{record.buildingName}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{record.date}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{record.person}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[300px]">{record.issueDetails}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{record.durationMinutes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} records
                </p>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1">{currentPage} / {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};
