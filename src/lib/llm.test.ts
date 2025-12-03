import { GoogleGenerativeAI } from '@google/generative-ai';

describe('LLM Utility', () => {
    let groupReviews: any;
    let generateWeeklyPulse: any;
    let mockGenerateContent: jest.Mock;
    let mockGetGenerativeModel: jest.Mock;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        mockGenerateContent = jest.fn();
        mockGetGenerativeModel = jest.fn(() => ({
            generateContent: mockGenerateContent,
        }));

        jest.doMock('@google/generative-ai', () => ({
            GoogleGenerativeAI: jest.fn(() => ({
                getGenerativeModel: mockGetGenerativeModel,
            })),
        }));

        // Re-import the module after setting up the mock
        const llmModule = require('./llm');
        groupReviews = llmModule.groupReviews;
        generateWeeklyPulse = llmModule.generateWeeklyPulse;
    });

    describe('groupReviews', () => {
        it('should group reviews correctly', async () => {
            const mockResponse = JSON.stringify([
                { review_id: '1', chosen_theme: 'Onboarding', short_reason: 'Test reason' },
            ]);

            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => mockResponse,
                },
            });

            const reviews = [{ id: '1', text: 'Test review', userName: 'User', date: '2023-01-01', score: 5, source: 'google_play' as const }];
            const result = await groupReviews(reviews);

            expect(result).toHaveLength(1);
            expect(result[0].chosen_theme).toBe('Onboarding');
        });

        it('should handle errors gracefully', async () => {
            mockGenerateContent.mockRejectedValue(new Error('API Error'));
            const reviews = [{ id: '1', text: 'Test review', userName: 'User', date: '2023-01-01', score: 5, source: 'google_play' as const }];

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const result = await groupReviews(reviews);

            expect(result).toHaveLength(0);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('generateWeeklyPulse', () => {
        it('should generate weekly pulse report', async () => {
            const mockData = {
                title: 'Weekly Pulse',
                overview: 'Overview text',
                top_themes: ['Theme 1'],
                user_quotes: ['Quote 1'],
                action_ideas: ['Action 1'],
            };

            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => JSON.stringify(mockData),
                },
            });

            const reviews = [{ id: '1', text: 'Test review', userName: 'User', date: '2023-01-01', score: 5, source: 'google_play' as const }];
            const groupedReviews = [{ review_id: '1', chosen_theme: 'Theme 1' }];

            const result = await generateWeeklyPulse(reviews, groupedReviews);

            expect(result.title).toBe('Weekly Pulse');
            expect(result.html_report).toContain('<h1>Weekly Pulse</h1>');
            expect(result.markdown_report).toContain('# Weekly Pulse');
        });
    });
});
