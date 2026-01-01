import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api'; // Assuming the main app runs on 3000

export interface StatsResponse {
    activityByDay: { name: string; total: number }[];
    languages: { name: string; value: number; color: string; icon: string }[];
    projects: { name: string; value: number; hours: number }[];
    recentActivity: any[];
    summary: {
        totalTime: string;
        totalTime24h: string;
        dailyAverage: string;
        topProject: string;
        topProject24h: string;
        topLanguage: string;
        topLanguage24h: string;
        topLanguageIcon: string;
        topLanguageIcon24h?: string;
        isLive: boolean;
        lastHeartbeatAt: string;
        percentGrowth: number;
        currentStreak: number;
    };
}

export const fetchStats = async (apiKey: string): Promise<StatsResponse> => {
    const response = await axios.get(`${BASE_URL}/stats`, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    });
    return response.data;
};
