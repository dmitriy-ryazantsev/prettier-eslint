export const ESLint = jest.fn().mockImplementation(() => ({
    lintText: jest.fn(),
}));
