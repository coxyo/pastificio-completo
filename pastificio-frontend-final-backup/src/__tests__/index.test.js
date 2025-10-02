describe('Home Page', () => {
  test('test di base funziona', () => {
    expect(1 + 1).toBe(2)
  })
  
  test('verifica titolo app', () => {
    const title = 'Pastificio Nonna Claudia'
    expect(title).toContain('Nonna Claudia')
  })
})
