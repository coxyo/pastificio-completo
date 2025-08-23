describe('Test di Base', () => {
  test('dovrebbe passare un test matematico', () => {
    expect(2 + 2).toBe(4);
  });

  test('dovrebbe verificare stringhe', () => {
    const nome = 'Pastificio Nonna Claudia';
    expect(nome).toContain('Nonna');
  });

  test('dovrebbe verificare oggetti', () => {
    const ordine = {
      cliente: 'Mario Rossi',
      totale: 100,
      prodotti: ['Spaghetti', 'Penne']
    };
    
    expect(ordine).toHaveProperty('cliente');
    expect(ordine.totale).toBeGreaterThan(50);
    expect(ordine.prodotti).toHaveLength(2);
  });
});