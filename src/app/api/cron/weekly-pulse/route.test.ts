/**
 * @jest-environment node
 */
jest.mock('@/lib/scraper', () => ({
    fetchReviews: jest.fn(),
}));
jest.mock('@/lib/llm', () => ({
    groupReviews: jest.fn(),
    generateWeeklyPulse: jest.fn(),
}));
jest.mock('@/lib/email', () => ({
    sendEmail: jest.fn(),
}));

import { GET } from './route';
import { fetchReviews } from '@/lib/scraper';
import { groupReviews, generateWeeklyPulse } from '@/lib/llm';
import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

describe('Weekly Pulse Cron', () => {
    const mockRequest = (authHeader: string | null) => ({
        headers: {
            get: jest.fn().mockReturnValue(authHeader),
        },
    }) as unknown as Request;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.CRON_SECRET = 'test-secret';
    });

    it('should return 401 if unauthorized', async () => {
        const request = mockRequest('Bearer wrong-secret');
        const response = await GET(request);
        expect(response.status).toBe(401);
    });

    it('should return 401 if no auth header', async () => {
        const request = mockRequest(null);
        const response = await GET(request);
        expect(response.status).toBe(401);
    });

    it('should return message if no reviews found', async () => {
        (fetchReviews as jest.Mock).mockResolvedValue([]);
        const request = mockRequest('Bearer test-secret');
        const response = await GET(request);
        const data = await response.json();

        expect(data.message).toBe('No reviews found');
        expect(groupReviews).not.toHaveBeenCalled();
    });

    it('should generate and send pulse if reviews found', async () => {
        const mockReviews = [{ id: '1', text: 'Review' }];
        const mockGrouped = [{ id: '1', theme: 'Test' }];
        const mockPulse = { title: 'Pulse' };

        (fetchReviews as jest.Mock).mockResolvedValue(mockReviews);
        (groupReviews as jest.Mock).mockResolvedValue(mockGrouped);
        (generateWeeklyPulse as jest.Mock).mockResolvedValue(mockPulse);

        const request = mockRequest('Bearer test-secret');
        const response = await GET(request);
        const data = await response.json();

        expect(data.message).toBe('Weekly pulse generated and sent');
        expect(data.pulse).toEqual(mockPulse);
        expect(sendEmail).toHaveBeenCalledWith(expect.any(String), mockPulse);
    });

    it('should handle errors gracefully', async () => {
        (fetchReviews as jest.Mock).mockRejectedValue(new Error('Fetch failed'));
        const request = mockRequest('Bearer test-secret');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Weekly pulse cron failed');
    });
});
