import type { ServiceRecord, AggregatedData } from '../types/data';

const calculateSMA = (data: { name: string; count: number }[], window: number) => {
    return data.map((item, index) => {
        if (index < window - 1) return { ...item };
        const slice = data.slice(index - window + 1, index + 1);
        const sum = slice.reduce((acc, curr) => acc + curr.count, 0);
        return { ...item, movingAverage: Math.round((sum / window) * 10) / 10 };
    });
};

export const calculateStatistics = (data: ServiceRecord[]): AggregatedData => {
    const byPersonMap = new Map<string, number>();
    const byCategoryMap = new Map<string, number>();
    const byIssueCategoryMap = new Map<string, number>();
    const byMonthMap = new Map<string, number>();
    const byYearMap = new Map<string, number>();
    const byWeekMap = new Map<string, number>();
    const byDayOfWeekMap = new Map<string, number>();
    const personPerfMap = new Map<string, { total: number; count: number }>();

    for (let i = 0; i < data.length; i++) {
        const record = data[i];
        let { person, category, issueCategory, weekOfYear, dayOfWeek, durationMinutes, parsedYear, parsedMonthLabel, isValidYear } = record as any;

        // Fallback for legacy data that doesn't have pre-calculated fields
        if (isValidYear === undefined && (record.date || record.month)) {
            const combined = ((record.month || '') + ' ' + (record.date || '')).trim();
            const yMatch = combined.match(/(202[1-6])/) || combined.match(/([21-26])[\/\-]/);
            if (yMatch) {
                parsedYear = yMatch[1].length === 2 ? '20' + yMatch[1] : yMatch[1];
                if (Number(parsedYear) >= 2021 && Number(parsedYear) <= 2026) {
                    isValidYear = true;
                    const mMatch = combined.match(/(\d{1,2})月/) || combined.match(/[年\/\-](\d{1,2})/) || combined.match(/(\d{1,2})[\/\-]/);
                    if (mMatch) {
                        parsedMonthLabel = `${parsedYear}-${mMatch[1].trim().padStart(2, '0')}`;
                    }
                }
            }
        }

        if (person) {
            // Deep clean person name during aggregation to merge records like "Name(Mon)" and "Name(Tue)"
            const cleanPerson = person.replace(/[\(（].*?[\)）]/g, '').trim();

            byPersonMap.set(cleanPerson, (byPersonMap.get(cleanPerson) || 0) + 1);
            const perf = personPerfMap.get(cleanPerson) || { total: 0, count: 0 };
            personPerfMap.set(cleanPerson, {
                total: perf.total + (durationMinutes || 0),
                count: perf.count + 1
            });
        }
        if (category) byCategoryMap.set(category, (byCategoryMap.get(category) || 0) + 1);
        if (issueCategory) byIssueCategoryMap.set(issueCategory, (byIssueCategoryMap.get(issueCategory) || 0) + 1);
        if (dayOfWeek) byDayOfWeekMap.set(dayOfWeek, (byDayOfWeekMap.get(dayOfWeek) || 0) + 1);

        if (isValidYear) {
            byYearMap.set(parsedYear, (byYearMap.get(parsedYear) || 0) + 1);

            if (parsedMonthLabel) {
                byMonthMap.set(parsedMonthLabel, (byMonthMap.get(parsedMonthLabel) || 0) + 1);
            }

            if (weekOfYear !== undefined && weekOfYear !== 0) {
                const weekKey = `${parsedYear}-W${String(weekOfYear).padStart(2, '0')}`;
                byWeekMap.set(weekKey, (byWeekMap.get(weekKey) || 0) + 1);
            }
        }
    }

    const totalRecords = data.length;

    const byPerson = Array.from(byPersonMap.entries())
        .map(([name, count]) => ({
            name,
            count,
            percentage: totalRecords > 0 ? Number(((count / totalRecords) * 100).toFixed(1)) : 0
        }))
        .filter(p => p.count >= 1000) // Show only those with 1000+ records
        .sort((a, b) => b.count - a.count);

    const dayOrder = ['月', '火', '水', '木', '金', '土', '日'];
    const byDayOfWeek = dayOrder.map(day => ({
        name: day,
        count: byDayOfWeekMap.get(day) || 0
    }));

    const byMonthRaw = Array.from(byMonthMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const byWeekRaw = Array.from(byWeekMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const headers = data.length > 0 && data[0].raw ? Object.keys(data[0].raw) : [];

    return {
        headers,
        byPerson,
        byCategory: Array.from(byCategoryMap.entries()).map(([name, count]) => ({ name, count })),
        byIssueCategory: Array.from(byIssueCategoryMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15),
        byMonth: calculateSMA(byMonthRaw, 3),
        byYear: Array.from(byYearMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)),
        byWeek: calculateSMA(byWeekRaw, 4),
        byDayOfWeek,
        personPerformance: Array.from(personPerfMap.entries())
            .map(([name, perf]) => ({
                name,
                avgDuration: Math.round((perf.total / perf.count) * 10) / 10,
                totalCount: perf.count
            }))
            .filter(p => p.totalCount >= totalRecords * 0.005 || p.totalCount >= 50)
            .sort((a, b) => b.avgDuration - a.avgDuration)
    };
};
