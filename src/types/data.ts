export interface ServiceRecord {
    term: number; // 期
    totalId: number; // 総番号
    monthId: number; // 月番号
    machineId: number; // 号機
    link: string; // FCリンク
    buildingName: string; // 物件名
    category: string; // 区分
    issueDetails: string; // 障害内容
    responseTime: string; // 対応時間
    person: string; // 対応者
    region: string; // 地域
    ward: string; // 区県別
    date: string; // 対応日 (YYYY年M月D日)
    month: string; // 対応月 (YYYY年M月)
    weekOfMonth: number; // 対応週（月）
    weekOfYear: number; // 対応週（年）
    dayOfWeek: string; // 曜日
    issueCategory: string; // 障害区分
    level: string; // Level
    level2: string; // Level2
    version: string; // Ver.
    type: string; // type
    model: string; // 型式
    lockerSpec: string; // ロッカー仕様
    requestId: string; // 依頼番号
    startTime: string; // 作業開始時間
    endTime: string; // 作業終了時間
    durationMinutes: number; // 作業時間（分）
}

export type AggregatedData = {
    byPerson: { name: string; count: number; percentage?: number }[];
    byCategory: { name: string; count: number }[];
    byIssueCategory: { name: string; count: number }[];
    byMonth: { name: string; count: number; movingAverage?: number }[];
    byYear: { name: string; count: number }[];
    byWeek: { name: string; count: number; movingAverage?: number }[];
    byDayOfWeek: { name: string; count: number }[];
    personPerformance: { name: string; avgDuration: number; totalCount: number }[];
};
