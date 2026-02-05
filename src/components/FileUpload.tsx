import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
    onFileUpload: (content: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'text/plain') {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const text = event.target?.result as string;
                    onFileUpload(text);
                };
                reader.readAsText(file);
            }
        },
        [onFileUpload]
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                onFileUpload(text);
            };
            reader.readAsText(file);
        }
    };

    return (
        <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
        >
            <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <span className="text-lg font-medium text-gray-700">
                    Drop your .txt file here, or click to browse
                </span>
                <span className="text-sm text-gray-500 mt-2">
                    Supports legacy system export format
                </span>
            </label>
        </div>
    );
};
