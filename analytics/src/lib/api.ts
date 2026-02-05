import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface StatsResponse {
    activityByDay: { name: string; total: number }[];
    languages: { name: string; value: number; color: string }[];
    projects: { name: string; value: number; requests: number }[];
    summary: {
        totalRequests: number;
        requests24h: number;
        activeUsers: number;
        activeProjects: number;
        growth: number;
        isSystemOnline: boolean;
        systemLoad: string;
        uptime: string;
        avgResponseTime: string;
        errorRate: number;
        peakTrafficTime: string;
        newUsersThisWeek: number;
        totalHeartbeats: number;
        retentionRate: number;
        topEndpoint: string;
    };
}

export const fetchStats = async (adminSecret: string): Promise<StatsResponse> => {
    try {
        const response = await axios.get(`${BASE_URL}/admin/metrics`, {
            headers: {
                "X-Admin-Secret": adminSecret,
            },
            timeout: 5000,
        });
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.error || error.message;

            if (error.code === 'ECONNABORTED') {
                throw new Error('Request timed out after 5000ms. Check server status.');
            }

            if (!error.response) {
                throw new Error('Network error: Unable to connect to DevMeter Admin API.');
            }

            throw new Error(`Admin API Error (${status}): ${message}`);
        }
        throw error;
    }
};
