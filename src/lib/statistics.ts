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

    data.forEach((record) => {
        const { person, category, issueCategory, date, month, weekOfYear, dayOfWeek, durationMinutes } = record;

        if (person) {
            byPersonMap.set(person, (byPersonMap.get(person) || 0) + 1);
            const perf = personPerfMap.get(person) || { total: 0, count: 0 };
            personPerfMap.set(person, {
                total: perf.total + (durationMinutes || 0),
                count: perf.count + 1
            });
        }
        if (category) byCategoryMap.set(category, (byCategoryMap.get(category) || 0) + 1);
        if (issueCategory) byIssueCategoryMap.set(issueCategory, (byIssueCategoryMap.get(issueCategory) || 0) + 1);
        if (dayOfWeek) byDayOfWeekMap.set(dayOfWeek, (byDayOfWeekMap.get(dayOfWeek) || 0) + 1);

        const yearMatch = date.match(/(\d{4})年/) || date.match(/^(\d{4})/);
        const year = yearMatch ? yearMatch[1] : '';

        if (year && Number(year) >= 2021 && Number(year) <= 2026) {
            byYearMap.set(year, (byYearMap.get(year) || 0) + 1);
        }

        if (month) byMonthMap.set(month, (byMonthMap.get(month) || 0) + 1);

        if (year && weekOfYear) {
            const weekKey = `${year}-W${String(weekOfYear).padStart(2, '0')}`;
            byWeekMap.set(weekKey, (byWeekMap.get(weekKey) || 0) + 1);
        }
    });

    const totalRecords = data.length;

    const byPerson = Array.from(byPersonMap.entries())
        .map(([name, count]) => ({
            name,
            count,
            percentage: totalRecords > 0 ? Number(((count / totalRecords) * 100).toFixed(1)) : 0
        }))
        .filter(p => p.count >= 1000)
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

    return {
        byPerson,
        byCategory: Array.from(byCategoryMap.entries()).map(([name, count]) => ({ name, count })),
        byIssueCategory: Array.from(byIssueCategoryMap.entries()).map(([name, count]) => ({ name, count })),
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
            .filter(p => p.totalCount >= 100)
            .sort((a, b) => b.avgDuration - a.avgDuration)
    };
};
