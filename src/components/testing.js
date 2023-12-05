// Assuming mock data similar to the one I intended to use in the Python code
const mockExchangeRateData = [
    { date: '2023-01-01', rate: 20.5 },
    { date: '2023-01-02', rate: 20.6 },
    { date: '2023-01-03', rate: 20.7 },
  ];
  
  const mockAggregatedConsumption = {
    '2023-01-01': 100.0,
    '2023-01-02': 150.0,
    '2023-01-03': 200.0,
  };
  
  const mockAggregatedDataExcedente = {
    '2023-01-01': 10.0,
    '2023-01-02': 15.0,
    '2023-01-03': 20.0,
  };
  
  // The function that updates dailyData based on the exchangeRateData
  const updateDailyData = (exchangeRateData, aggregatedConsumption, aggregatedDataExcedente) => {
    return exchangeRateData.map(item => {
      const consumptionValue = aggregatedConsumption[item.date] || null;
      const consumptionExcedenteValue = aggregatedDataExcedente[item.date] || null;
  
      return {
        date: item.date,
        exchangeRate: item.rate,
        consumption: consumptionValue,
        consumptionExcedente: consumptionExcedenteValue,
        mxpPerCel: null,
        reqCel: null,
        dailyCostCel: null
      };
    });
  };
  
  // Running the function with mock data
  const derivedDailyData = updateDailyData(mockExchangeRateData, mockAggregatedConsumption, mockAggregatedDataExcedente);
  console.log(derivedDailyData);
  