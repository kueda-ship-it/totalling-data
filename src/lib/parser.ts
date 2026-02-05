import type { ServiceRecord } from '../types/data';

export const parseCSV = (content: string): ServiceRecord[] => {
    // Remove BOM if present
    const cleanContent = content.trim().replace(/^\uFEFF/, '');
    const lines = cleanContent.split(/\r?\n/);
    if (lines.length < 2) return [];

    // Extract and clean headers
    const headerLine = lines[0];
    const rawHeaders = headerLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, '').trim());

    // Deduplicate headers
    const headers: string[] = [];
    const counts = new Map<string, number>();
    rawHeaders.forEach(h => {
        let name = h || 'Column';
        if (counts.has(name)) {
            const count = counts.get(name)! + 1;
            counts.set(name, count);
            name = `${name}_${count}`;
        } else {
            counts.set(name, 0);
        }
        headers.push(name);
    });

    // Helper to find column index by name (support partial match and multiple candidates)
    const findIndex = (names: string[]): number => {
        const lowerHeaders = headers.map(h => h.toLowerCase().trim());
        for (const name of names) {
            const target = name.toLowerCase().trim();
            const found = lowerHeaders.findIndex(h => h === target); // Exact match first
            if (found !== -1) return found;
        }
        for (const name of names) {
            const target = name.toLowerCase().trim();
            const found = lowerHeaders.findIndex(h => h.includes(target)); // Partial match second
            if (found !== -1) return found;
        }
        return -1;
    };

    const idx = {
        term: findIndex(['期']),
        totalId: findIndex(['総番号', 'No', 'ＩＤ', 'ID']),
        monthId: findIndex(['月番号']),
        machineId: findIndex(['号機', '機番', '機器ＩＤ', '機器ID']),
        link: findIndex(['FCリンク', 'FCリンク先']),
        buildingName: findIndex(['物件名', '建物', '物件', '設置先']),
        category: findIndex(['区分', '作業区分']),
        issueDetails: findIndex(['障害内容', '内容', '詳細']),
        responseTime: findIndex(['対応時間']),
        person: findIndex(['対応者', '担当者', '作業員', '担当', '人']),
        region: findIndex(['地域', 'エリア', '拠点', '支店']),
        ward: findIndex(['区県別']),
        date: findIndex(['対応日', '作業日', '日付', '受付日', '完了日', '実施日', '年月日']),
        month: findIndex(['対応月', '作業月', '対象月']),
        weekOfMonth: findIndex(['対応週（月）', '週（月）']),
        weekOfYear: findIndex(['対応週（年）', '週（年）']),
        dayOfWeek: findIndex(['曜日']),
        issueCategory: findIndex(['障害区分', '故障区分', '分類', '種別', 'カテゴリ']),
        level: findIndex(['Level', 'レベル']),
        level2: findIndex(['Level2']),
        version: findIndex(['Ver', 'バージョン']),
        type: findIndex(['type', 'タイプ']),
        model: findIndex(['型式', 'モデル']),
        lockerSpec: findIndex(['ロッカー仕様']),
        requestId: findIndex(['依頼番号', 'リクエスト', '受付番号']),
        startTime: findIndex(['作業開始時間', '開始時間', '着工']),
        endTime: findIndex(['作業終了時間', '終了時間', '完了時']),
        durationMinutes: findIndex(['作業時間（分）', '作業時間', '時間分']),
    };

    console.log('CSV Column Mapping:', idx);

    return lines.slice(1)
        .filter(line => line.length > 0)
        .map((line, rowIndex) => {
            // Fast CSV split
            const columns: string[] = [];
            let inQuotes = false;
            let current = '';
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    columns.push(current.trim().replace(/^"|"$/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            columns.push(current.trim().replace(/^"|"$/g, ''));

            const raw: Record<string, string> = {};
            headers.forEach((h, i) => {
                raw[h] = columns[i] || '';
            });

            // Clean person name
            let person = idx.person !== -1 ? columns[idx.person] : '';
            if (person && (person.includes('(') || person.includes('（'))) {
                person = person.replace(/[\(（].*?[\)）]/g, '').trim();
            }

            const dateStr = idx.date !== -1 ? columns[idx.date] : '';
            const monthOrig = idx.month !== -1 ? columns[idx.month] : '';

            // Year Extraction (support 4-digit and 2-digit)
            const combinedDate = (monthOrig + ' ' + dateStr).trim();
            let parsedYear = '';

            // Look for years specifically in 2021-2026 range or 2-digit years
            const y4Match = combinedDate.match(/(202[1-6])/);
            if (y4Match) {
                parsedYear = y4Match[1];
            } else {
                const y2Match = combinedDate.match(/(\d{2})[\/\-]/);
                if (y2Match) {
                    const y2 = y2Match[1];
                    if (Number(y2) >= 21 && Number(y2) <= 26) {
                        parsedYear = '20' + y2;
                    }
                }
            }

            const isValidYear = parsedYear !== '' && Number(parsedYear) >= 2021 && Number(parsedYear) <= 2026;

            // Month Extraction
            let parsedMonthLabel = '';
            if (isValidYear) {
                // Priority 1: Check monthStr column
                let mMatch = monthOrig.match(/(\d{4})[年\/\-](\d{1,2})/) || monthOrig.match(/[年\/\-](\d{1,2})/) || monthOrig.match(/(\d{1,2})[月]/);
                let monthVal = '';

                if (mMatch) {
                    monthVal = mMatch[2] || mMatch[1];
                } else if (monthOrig && !isNaN(Number(monthOrig)) && Number(monthOrig) >= 1 && Number(monthOrig) <= 12) {
                    monthVal = monthOrig;
                }

                // Priority 2: Fallback to date column
                if (!monthVal && dateStr) {
                    const dmMatch = dateStr.match(/(\d{4})[年\/\-](\d{1,2})/) || dateStr.match(/[年\/\-](\d{1,2})/);
                    if (dmMatch) {
                        monthVal = dmMatch[2] || dmMatch[1];
                    }
                }

                if (monthVal) {
                    parsedMonthLabel = `${parsedYear}-${monthVal.trim().padStart(2, '0')}`;
                }
            }

            if (rowIndex < 3) {
                console.log(`Row ${rowIndex} parse debug:`, { dateStr, monthOrig, parsedYear, parsedMonthLabel });
            }

            return {
                term: idx.term !== -1 ? Number(columns[idx.term]) || 0 : 0,
                totalId: idx.totalId !== -1 ? Number(columns[idx.totalId]) || 0 : 0,
                monthId: idx.monthId !== -1 ? Number(columns[idx.monthId]) || 0 : 0,
                machineId: idx.machineId !== -1 ? Number(columns[idx.machineId]) || 0 : 0,
                link: idx.link !== -1 ? columns[idx.link] || '' : '',
                buildingName: idx.buildingName !== -1 ? columns[idx.buildingName] || '' : '',
                category: idx.category !== -1 ? columns[idx.category] || '' : '',
                issueDetails: idx.issueDetails !== -1 ? columns[idx.issueDetails] || '' : '',
                responseTime: idx.responseTime !== -1 ? columns[idx.responseTime] || '' : '',
                person: person,
                region: idx.region !== -1 ? columns[idx.region] || '' : '',
                ward: idx.ward !== -1 ? columns[idx.ward] || '' : '',
                date: dateStr,
                month: monthOrig,
                weekOfMonth: idx.weekOfMonth !== -1 ? Number(columns[idx.weekOfMonth]) || 0 : 0,
                weekOfYear: idx.weekOfYear !== -1 ? Number(columns[idx.weekOfYear]) || 0 : 0,
                dayOfWeek: idx.dayOfWeek !== -1 ? columns[idx.dayOfWeek] || '' : '',
                issueCategory: idx.issueCategory !== -1 ? columns[idx.issueCategory] || '' : '',
                level: idx.level !== -1 ? columns[idx.level] || '' : '',
                level2: idx.level2 !== -1 ? columns[idx.level2] || '' : '',
                version: idx.version !== -1 ? columns[idx.version] || '' : '',
                type: idx.type !== -1 ? columns[idx.type] || '' : '',
                model: idx.model !== -1 ? columns[idx.model] || '' : '',
                lockerSpec: idx.lockerSpec !== -1 ? columns[idx.lockerSpec] || '' : '',
                requestId: idx.requestId !== -1 ? columns[idx.requestId] || '' : '',
                startTime: idx.startTime !== -1 ? columns[idx.startTime] || '' : '',
                endTime: idx.endTime !== -1 ? columns[idx.endTime] || '' : '',
                durationMinutes: idx.durationMinutes !== -1 ? Number(columns[idx.durationMinutes]) || 0 : 0,
                raw: raw,
                parsedYear,
                parsedMonthLabel,
                isValidYear,
                isValidMonth: !!parsedMonthLabel
            };
        });
};

