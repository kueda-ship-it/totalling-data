import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, FileImage, FileText } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface Props {
    containerRef: React.RefObject<HTMLDivElement>;
    title: string;
}

export const ChartExportMenu: React.FC<Props> = ({ containerRef, title }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const exportToPng = async () => {
        if (!containerRef.current) return;
        setIsOpen(false);
        try {
            const dataUrl = await toPng(containerRef.current, { backgroundColor: '#ffffff', quality: 1 });
            const link = document.createElement('a');
            link.download = `${title}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to export image', err);
        }
    };

    const exportToPdf = async () => {
        if (!containerRef.current) return;
        setIsOpen(false);
        try {
            const dataUrl = await toPng(containerRef.current, { backgroundColor: '#ffffff', quality: 1 });
            const pdf = new jsPDF('l', 'px', [containerRef.current.clientWidth, containerRef.current.clientHeight]);
            pdf.addImage(dataUrl, 'PNG', 0, 0, containerRef.current.clientWidth, containerRef.current.clientHeight);
            pdf.save(`${title}.pdf`);
        } catch (err) {
            console.error('Failed to export PDF', err);
        }
    };

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Export options"
            >
                <MoreHorizontal size={20} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu">
                        <button
                            onClick={exportToPng}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                        >
                            <FileImage size={16} className="mr-3 text-gray-400" />
                            PNGとして保存
                        </button>
                        <button
                            onClick={exportToPdf}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                        >
                            <FileText size={16} className="mr-3 text-gray-400" />
                            PDFとして保存
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
