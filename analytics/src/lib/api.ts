import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
    try {
        const response = await axios.get(`${BASE_URL}/stats`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            timeout: 5000, // 5 second timeout
        });
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.error || error.message;

            if (error.code === 'ECONNABORTED') {
                throw new Error('Request timed out after 5000ms. Please check your connection or server status.');
            }

            if (!error.response) {
                throw new Error('Network error: Unable to connect to the DevMeter API. Ensure the server is running.');
            }

            throw new Error(`API Error (${status}): ${message}`);
        }
        throw error;
    }
};
