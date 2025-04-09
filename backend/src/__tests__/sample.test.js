describe('Sample Test Suite', () => {
  test('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  test('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
}); 