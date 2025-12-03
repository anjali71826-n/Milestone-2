import { sendEmail } from './email';
import { Resend } from 'resend';

jest.mock('resend');

describe('sendEmail', () => {
    const mockSend = jest.fn();
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, RESEND_API_KEY: 'test-api-key' };
        (Resend as unknown as jest.Mock).mockImplementation(() => ({
            emails: {
                send: mockSend,
            },
        }));
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should throw error if RESEND_API_KEY is not defined', async () => {
        delete process.env.RESEND_API_KEY;
        await expect(sendEmail('test@example.com', {})).rejects.toThrow('RESEND_API_KEY is not defined');
    });

    it('should send email with provided html_report', async () => {
        mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });
        const content = { html_report: '<p>Test Report</p>' };

        await sendEmail('test@example.com', content);

        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            to: ['test@example.com'],
            html: '<p>Test Report</p>',
        }));
    });

    it('should generate html content if html_report is not provided', async () => {
        mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });
        const content = {
            title: 'Test Title',
            overview: 'Test Overview',
            top_themes: ['Theme 1'],
            user_quotes: ['Quote 1'],
            action_ideas: ['Action 1'],
        };

        await sendEmail('test@example.com', content);

        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            to: ['test@example.com'],
            html: expect.stringContaining('<h1>Test Title</h1>'),
        }));
    });

    it('should throw error if resend fails', async () => {
        mockSend.mockResolvedValue({ data: null, error: { message: 'Send failed' } });
        const content = { html_report: '<p>Test</p>' };

        await expect(sendEmail('test@example.com', content)).rejects.toThrow('Resend error: Send failed');
    });
});
