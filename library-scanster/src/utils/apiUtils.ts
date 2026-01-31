
// Simulate API calls with a delay
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
