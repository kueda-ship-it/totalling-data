import type { ServiceRecord } from '../types/data';

export const parseCSV = (content: string): ServiceRecord[] => {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    // Header index map based on the provided image
    // 期(0), 総番号(1), 月番号(2), 号機(3), FCリンク(4), 物件名(5), 区分(6), 障害内容(7), 対応時間(8), 対応者(9), 
    // 地域(10), 区県別(11), 対応日(12), 対応月(13), 対応週（月）(14), 対応週（年）(15), 曜日(16), 障害区分(17), 
    // Level(18), Level2(19), Ver.(20), type(21), 型式(22), ロッカー仕様(23), 依頼番号(24), 作業開始時間(25), 作業終了時間(26), 作業時間（分）(27)

    return lines.slice(1)
        .filter(line => line.trim().length > 0)
        .map((line) => {
            const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.trim().replace(/^"|"$/g, ''));

            // Clean person name (remove patterns like "田中(月)" or "田中（月）")
            let person = columns[9] || '';
            person = person.replace(/[\(（].*?[\)）]/g, '').trim();

            return {
                term: Number(columns[0]) || 0,
                totalId: Number(columns[1]) || 0,
                monthId: Number(columns[2]) || 0,
                machineId: Number(columns[3]) || 0,
                link: columns[4] || '',
                buildingName: columns[5] || '',
                category: columns[6] || '',
                issueDetails: columns[7] || '',
                responseTime: columns[8] || '',
                person: person,
                region: columns[10] || '',
                ward: columns[11] || '',
                date: columns[12] || '',
                month: columns[13] || '',
                weekOfMonth: Number(columns[14]) || 0,
                weekOfYear: Number(columns[15]) || 0,
                dayOfWeek: columns[16] || '',
                issueCategory: columns[17] || '',
                level: columns[18] || '',
                level2: columns[19] || '',
                version: columns[20] || '',
                type: columns[21] || '',
                model: columns[22] || '',
                lockerSpec: columns[23] || '',
                requestId: columns[24] || '',
                startTime: columns[25] || '',
                endTime: columns[26] || '',
                durationMinutes: Number(columns[27]) || 0,
            };
        });
};
