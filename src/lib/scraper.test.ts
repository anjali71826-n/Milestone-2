import { fetchReviews } from './scraper';
import gplay from 'google-play-scraper';
import store from 'app-store-scraper';

jest.mock('google-play-scraper', () => ({
    reviews: jest.fn(),
    sort: { NEWEST: 1 },
}));
jest.mock('app-store-scraper', () => ({
    reviews: jest.fn(),
    sort: { RECENT: 1 },
}));

describe('fetchReviews', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch and filter reviews correctly', async () => {
        const mockDate = new Date();
        const recentDate = new Date(mockDate);
        recentDate.setDate(recentDate.getDate() - 1);
        const oldDate = new Date(mockDate);
        oldDate.setDate(oldDate.getDate() - 100);

        (gplay.reviews as jest.Mock).mockResolvedValue({
            data: [
                { id: '1', userName: 'User1', date: recentDate.toISOString(), score: 5, text: 'Review 1' },
                { id: '2', userName: 'User2', date: oldDate.toISOString(), score: 4, text: 'Review 2' },
            ],
        });

        (store.reviews as jest.Mock)
            .mockResolvedValueOnce([
                { id: '3', userName: 'User3', updated: recentDate.toISOString(), score: 3, text: 'Review 3' },
            ])
            .mockResolvedValue([]);

        const reviews = await fetchReviews();

        expect(reviews).toHaveLength(2); // Should filter out the old review
        expect(reviews.find(r => r.id === '1')).toBeDefined();
        expect(reviews.find(r => r.id === '3')).toBeDefined();
        expect(reviews.find(r => r.id === '2')).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
        (gplay.reviews as jest.Mock).mockRejectedValue(new Error('Network Error'));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const reviews = await fetchReviews();

        expect(reviews).toHaveLength(0);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
