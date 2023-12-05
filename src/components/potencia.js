import React, { useState, useEffect, useMemo } from 'react';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import styles from './potencias.module.css'; // Assuming your styles file is named 'potencias.module.css'
import Papa from 'papaparse'; // Importing the library for parsing CSV files

function Potencias() {
    // Define initial state for the table data
    const [data, setData] = useState([
        { year: 2020, pnp: 2846498.96, demand: 1.2, billing: null },
        { year: 2021, pnp: 3605756.72, demand: 1.2, billing: null },
        { year: 2022, pnp: 1622267.01, demand: 1.2, billing: null }
    ]);
    const [file, setFile] = useState(null); // State for storing the uploaded file
    const [exchangeRates, setExchangeRates] = useState([]); // State for storing the fetched exchange rates
    const [dates, setDates] = useState([]); // State for the extracted dates
    const [exchangeRateData, setExchangeRateData] = useState([]); // State for storing the exchange rates
    const [aggregatedConsumption, setAggregatedConsumption] = useState({});
    const [aggregatedDataExcedente, setAggregatedDataExcedente] = useState({});
    const [dailyData, setDailyData] = useState([]);
    const [forceUpdate, setForceUpdate] = useState(0);
    // Declare the state to store the original CSV data
    const [originalCSVData, setOriginalCSVData] = useState('');

     // Define initial CEL data with two rows
     const initialCelData = useMemo(() => [
        { month: '', consumo: null, percentage: 13.90, cost: 25.21, type: 'CEL' },
        { month: '', consumo: null, percentage: 13.90, cost: 25.21, type: 'CEL Excedente' }
    ], []);
    const [celData, setCelData] = useState(initialCelData); // State variable for CEL data
    const percentage = 13.90 / 100; // Convert to a decimal
    // Extract the fixed CEL cost from the initial CEL data (assuming it's at the first row and cost is the right field)
    const fixedCelCost = celData[0].cost;




    const convertToCSV = (jsonData) => {
        const csvString = Papa.unparse(jsonData, {
          quotes: false, // Do not add quotes unless necessary
          delimiter: ",", // Use tab as the delimiter if that's what the original data uses
        });
        console.log("Converted CSV:", csvString);
        return csvString;
      };

     // Helper function to remove all quotes from the CSV data
const removeUnwantedQuotes = (csvString) => {
    // This will remove all quotes
    return csvString.replace(/"/g, '');
  };
    
    
  const extractData = () => {
    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          console.log("Raw CSV Data:", result.data);
          console.log("Original CSV Content:", Papa.unparse(result.data));
          setOriginalCSVData(Papa.unparse(result.data));
  
          const aggregatedData = {};
          const aggregatedDataExcedente = {}; // Object for Excedente data
          let firstDayProcessed = false;
          let firstDayData = []; // Array to store all data for the first day
  
          for (let i = 4; i < result.data.length; i++) {
            const rawRowData = result.data[i]; // Capture the entire row data
            console.log(`Row ${i} raw data: `, rawRowData); // Log the raw data of each row
  
            const rawDate = rawRowData[""];
            let convertedDate;
            if (rawDate.includes("-") && rawDate.length === 8) {    
              convertedDate = convertDateFormat(rawDate);
            } else {
              convertedDate = rawDate;
            }
  
            const consumo = parseFloat(rawRowData['_9']);
            const consumoExcedente = parseFloat(rawRowData['_6']);
  
            if (convertedDate === firstDayProcessed || !firstDayProcessed) {
              firstDayData.push({ // Add all first day data to the array
                hour: rawRowData['_1'],
                consumo: consumo,
                consumoExcedente: consumoExcedente
              });
            }
  
            if (!firstDayProcessed) {
              firstDayProcessed = convertedDate; // Set the first day processed to the current date
            }
  
            if (convertedDate && !isNaN(consumo)) {
              aggregatedData[convertedDate] = (aggregatedData[convertedDate] || 0) + consumo;
            }
  
            if (convertedDate && !isNaN(consumoExcedente)) {
              aggregatedDataExcedente[convertedDate] = (aggregatedDataExcedente[convertedDate] || 0) + consumoExcedente;
            }
          }
  
          console.log("First day data:", firstDayData); // Log all data for the first day
          console.log("Aggregated data:", aggregatedData);
          console.log("Aggregated data Excedente:", aggregatedDataExcedente);
  
          const extractedDates = Object.keys(aggregatedData);
          console.log("Extracted dates:", extractedDates);
  
          setAggregatedConsumption(aggregatedData);
          setAggregatedDataExcedente(aggregatedDataExcedente);
          setDates(extractedDates);
  
          const updatedDailyData = exchangeRateData.map(item => {
            return {
              ...item,
              consumption: aggregatedData[item.date] || null,
              consumptionExcedente: aggregatedDataExcedente[item.date] || null
            };
          });
          setDailyData(updatedDailyData);
  
          console.log("Updated dailyData state after setting:", updatedDailyData);
        },
        header: true,
        skipEmptyLines: true,
        error: (error) => {
          console.log("An error occurred while parsing the CSV file:", error);
        }
      });
    } else {
      console.log("No file selected for parsing.");
    }
  };
  
  
  



    const downloadCSV = () => {
        console.log("downloadCSV function called");
        // Convert each table's data to CSV
        let table1CSV = convertToCSV(data); // Convert PNP data
        let table2CSV = convertToCSV(celData); // Convert CEL data
        let table3CSV = convertToCSV(exchangeRateData); // Convert Exchange Rate data
        let table4CSV = convertToCSV(dailyData); // Convert Daily Calculations data
      
        // Debugging: Log the converted CSV data for each table
        console.log("Table 1 CSV:", table1CSV);
        console.log("Table 2 CSV:", table2CSV);
        console.log("Table 3 CSV:", table3CSV);
        console.log("Table 4 CSV:", table4CSV);
      
        // Remove quotes from the start and end of each line for each table CSV data
        table1CSV = removeUnwantedQuotes(table1CSV);
        table2CSV = removeUnwantedQuotes(table2CSV);
        table3CSV = removeUnwantedQuotes(table3CSV);
        table4CSV = removeUnwantedQuotes(table4CSV);
      
        // Debugging: Log the CSV data after removing unwanted quotes
        console.log("Table 1 CSV after removing quotes:", table1CSV);
        console.log("Table 2 CSV after removing quotes:", table2CSV);
        console.log("Table 3 CSV after removing quotes:", table3CSV);
        console.log("Table 4 CSV after removing quotes:", table4CSV);
      
        // Process the original CSV data to remove quotes from the start and end of each line
        let processedOriginalCSVData = removeUnwantedQuotes(originalCSVData);
      
        // Debugging: Log the processed original CSV data
        console.log("Processed Original CSV Data:", processedOriginalCSVData);
      
        // Count the number of lines in the original CSV
        const originalLinesCount = processedOriginalCSVData.split('\n').length;
      
        // Calculate how many blank lines we need to add to reach row 760
        const paddingLines = Math.max(800 - originalLinesCount - 2, 0); // -2 for the extra line breaks between tables, ensure it's not negative
      
        // Create a string with the necessary number of blank lines
        const padding = Array.from({ length: paddingLines }, () => '').join('\n');
      
        // Combine all CSV strings into one, with padding lines where necessary
        const combinedCSV = [processedOriginalCSVData, padding, table1CSV, table2CSV, table3CSV, table4CSV].join('\n\n');
      
        // Debugging: Log the final combined CSV data before creating the Blob
        console.log("Combined CSV Data:", combinedCSV);
      
        // Create a Blob from the CSV string
        const csvBlob = new Blob([combinedCSV], { type: 'text/csv;charset=utf-8;' });
      
        // Create a link and trigger the download
        const csvUrl = URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        link.href = csvUrl;
        link.setAttribute('download', 'combined_data_II.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      


      
      
    // Function to calculate 'Facturación estimada mensual'
    const calculateBilling = (rowData) => {
        const monthlyPNP = rowData.pnp / 12;
        const estimatedBilling = monthlyPNP * rowData.demand * 1.201; // As per your formula
        return estimatedBilling;
    };


    // Calculate billing when component mounts for initial data
    useEffect(() => {
        console.log("useEffect for initial billing calculation triggered");
        const initialDataWithBilling = data.map(row => {
            return { ...row, billing: calculateBilling(row) };
        });
        setData(initialDataWithBilling);
    }, []); // Empty dependency array means this runs once when component mounts


    const convertDateFormat = (dateString) => {
        const [day, month, year] = dateString.split("-");
        return `20${year}-${month}-${day}`;
    };
    

    // useEffect to call extractData whenever file state changes
    useEffect(() => {
        console.log("useEffect for file change triggered");
        extractData();
    }, [file]);


     // Helper function to get the name of the month
   const getMonthName = (dateString) => {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // Split the date string into its components [year, month, day]
    const [year, month, day] = dateString.split("-");

    // Create a new Date object, using the year, month, and day. 
    // Note: We subtract 1 from the month since months are zero-indexed in JavaScript Date objects.
    const date = new Date(year, month - 1, day);

    return monthNames[date.getMonth()];
};


    // Helper function to format the date strings
    const formatDate = (dateString) => {
        return dateString.split('T')[0];
    };

    
    // Function to handle file upload and send to the server
    const submitFile = async () => {
        if (!file) {
            console.log("No file selected.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5000/api/process_csv', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                console.log("Backend error.");
            } else {
                const data = await response.json();
                setExchangeRates(data); // Set the exchange rates data received from the backend
            }
        } catch (error) {
            console.error("Error submitting file", error);
        }
    };
 
    const fetchExchangeRates = async (dates) => {
        console.log("Debug: fetchExchangeRates called with dates:", dates); // Debug statement
    
        try {
            // Request payload, sending the dates array
            const payload = { dates: dates };
    
            console.log("Debug: Sending request with payload:", payload); // Debug statement
    
            // Sending request to the backend
            const response = await fetch('http://localhost:5000/api/fetch_exchange_rates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
    
            // Error handling for the response
            if (!response.ok) {
                console.error("Backend error. Status:", response.status, "Status text:", response.statusText);
                return;
            }
    
            // Retrieving and setting the exchange rate data
            const data = await response.json();
            console.log("Debug: Response received from the server:", data); // Debug statement
    
            // Sort the data by date
            const sortedData = data.exchangeRates.sort((a, b) => new Date(a.date) - new Date(b.date));
    
            // Format the date strings and remove the "T00:00" part
            const formattedData = sortedData.map(item => {
                const dateParts = item.date.split('T');
                return {
                    ...item,
                    date: dateParts[0] // Keep only the date part
                };
            });
    
            setExchangeRateData(formattedData); // assuming the response structure is { exchangeRates: [...] }
        } catch (error) {
            console.error("Error fetching exchange rates:", error);
        }
    };
    

    // useEffect to call fetchExchangeRates whenever dates state changes
    useEffect(() => {
        console.log("useEffect for fetching exchange rates triggered");
        if (dates.length) {
            console.log("Debug: Dates state updated, calling fetchExchangeRates"); // Debug statement
            fetchExchangeRates(dates);
        }
    }, [dates]);

    // Handle after cell change
    const handleAfterChange = (changes, source) => {
        if (changes) {
            const updatedData = [...data]; // create a new array
            changes.forEach(([row, prop, oldValue, newValue]) => {
                if (['pnp', 'demand'].includes(prop) && oldValue !== newValue) { // Check if the change is in 'pnp' or 'demand'
                    const updatedRow = { ...updatedData[row] }; // copy the old row
                    updatedRow[prop] = newValue; // update the value
                    updatedRow.billing = calculateBilling(updatedRow); // recalculate billing
                    updatedData[row] = updatedRow; // update the row in the new array
                }
            });
            setData(updatedData); // set state to the new array, which will trigger re-render
        }
    };

    
    useEffect(() => {
        // Ensure that both exchangeRateData and aggregatedConsumption have data and celData is loaded
        if (exchangeRateData.length > 0 && Object.keys(aggregatedConsumption).length > 0 && celData.length > 0) {
            // Log the states before mapping them to dailyData
            console.log('exchangeRateData state before mapping:', exchangeRateData);
            console.log('aggregatedConsumption state before mapping:', aggregatedConsumption);
            console.log('aggregatedDataExcedente state before mapping:', aggregatedDataExcedente);
            
            // Extract the fixed CEL cost and the percentage from the initial CEL data
            const fixedCelCost = celData[0].cost;
            const fixedPercentage = celData[0].percentage / 100; // Convert percentage to a decimal for calculation
    
            const derivedData = exchangeRateData.map(item => {
                // Log the mapping process for each item
                console.log('Mapping data for date:', item.date);
                console.log('Aggregated Consumption for date:', aggregatedConsumption[item.date]);
                console.log('Aggregated Excedente for date:', aggregatedDataExcedente[item.date]);
    
                const consumptionValue = aggregatedConsumption.hasOwnProperty(item.date) ? aggregatedConsumption[item.date] : null;
                const consumptionExcedenteValue = aggregatedDataExcedente.hasOwnProperty(item.date) ? aggregatedDataExcedente[item.date] : null;
    
                // New MXP/CEL calculation using the extracted fixed CEL cost
                const mxpPerCel = item.rate * fixedCelCost;
                
                // REQCEL calculation using the consumption value and fixed percentage
                const reqCel = consumptionValue ? consumptionValue * fixedPercentage : null;
    
                // REQCEL Excedente calculation using the consumption excedente value and fixed percentage
                const reqCelExcedente = consumptionExcedenteValue ? consumptionExcedenteValue * fixedPercentage : null;
    
                // COSTO DIARIO CEL calculation using the MXP/CEL value and REQCEL
                const dailyCostCel = reqCel !== null ? mxpPerCel * reqCel : null;
    
                // COSTO DIARIO Excedente calculation using the MXP/CEL value and REQCEL Excedente
                const dailyCostCelExcedente = reqCelExcedente !== null ? mxpPerCel * reqCelExcedente : null;
    
                return {
                    ...item,
                    exchangeRate: item.rate,
                    consumption: consumptionValue,
                    consumptionExcedente: consumptionExcedenteValue,
                    mxpPerCel: mxpPerCel,
                    reqCel: reqCel,
                    reqCelExcedente: reqCelExcedente,
                    dailyCostCel: dailyCostCel, // New COSTO DIARIO CEL calculation
                    dailyCostCelExcedente: dailyCostCelExcedente // New COSTO DIARIO Excedente calculation
                };
            });
    
            // Log the derived daily data before setting state
            console.log("Derived daily data before setting state:", derivedData);
            setDailyData(derivedData);
    
            // Log right after setting the dailyData
            console.log("Updated dailyData state after setting:", derivedData);
        }
    }, [exchangeRateData, aggregatedConsumption, aggregatedDataExcedente ]);
    
     // Include celData in the dependency array if its value can change
    
    
    

    useEffect(() => {
        console.log('CSV file uploaded effect triggered');
        extractData();
     }, [file]);
     
     useEffect(() => {
        console.log('dates effect triggered');
        if (dates.length) {
           fetchExchangeRates(dates);
        }
     }, [dates]);


    console.log("Debug: dailyData", dailyData);
console.log("Debug: First data entry", dailyData[0]);


//useEffect(() => {
  // setForceUpdate(prev => prev + 1);
//}, [dailyData]);

console.log("dailyData before rendering HotTable:", dailyData);

const hotTableKey = useMemo(() => JSON.stringify(dailyData), [dailyData]);


const calculateCelTotals = (dailyData) => {
    const totals = dailyData.reduce(
        (acc, current) => {
            acc.totalConsumo += current.consumption || 0;
            acc.totalConsumoExcedente += current.consumptionExcedente || 0;
            return acc;
        },
        { totalConsumo: 0, totalConsumoExcedente: 0 }
    );
    console.log('Totals calculated from dailyData:', totals);
    return totals;
};

useEffect(() => {
    if (dailyData && dailyData.length > 0) {
        // Continue with existing calculations
        const { totalConsumo, totalConsumoExcedente } = calculateCelTotals(dailyData);
        const percentageDecimal = percentage;

        // New calculations for COSTO DIARIO CEL and Excedente
        const totalCostoDiarioCel = dailyData.reduce((sum, row) => sum + (parseFloat(row.dailyCostCel) || 0), 0);
        const totalCostoDiarioExcedente = dailyData.reduce((sum, row) => sum + (parseFloat(row.dailyCostCelExcedente) || 0), 0);

        // Map through celData and update with new values
        const newCelData = celData.map((item, index) => {
            let calculatedPercentageValue = 0;

            if (index === 0) {
                // Keep the existing calculation for the first row
                calculatedPercentageValue = totalConsumo * percentageDecimal;
                return { ...item, consumo: totalConsumo, calculatedPercentage: calculatedPercentageValue, cost: totalCostoDiarioCel };
            } else if (index === 1) {
                // Keep the existing calculation for the second row
                calculatedPercentageValue = totalConsumoExcedente * percentageDecimal;
                return { ...item, consumo: totalConsumoExcedente, calculatedPercentage: calculatedPercentageValue, cost: totalCostoDiarioExcedente };
            }
            return item;
        });

        // Update celData if it has actually changed
        if (JSON.stringify(newCelData) !== JSON.stringify(celData)) {
            setCelData(newCelData);
        }
    }
}, [dailyData, celData, percentage]);




return (
    <div className={styles.container}> 
        <h1 className={styles.mainTitle}>Potencia y Cel</h1>
        <h2 className={styles.leftAlignedTitle}>PNP 2020 a 2023, estimación de facturación (CFE Calificados) por concepto de Potencia</h2>
        
        <div className={styles.tablesFlexContainer}>
                {/* PNP Table */}
                <div className={styles.tableWrapper}>
                    <HotTable
                        data={data}
                        colHeaders={['Año', 'PNP ($/MW 2020)', 'Demanda anual (MW)', 'Facturación estimada mensual']}
                        columns={[
                            { data: 'year', type: 'numeric', readOnly: true },
                            { data: 'pnp', type: 'numeric', numericFormat: { pattern: '0,0.00' } },
                            { data: 'demand', type: 'numeric', numericFormat: { pattern: '0,0.00' } },
                            { data: 'billing', type: 'numeric', readOnly: true, numericFormat: { pattern: '$0,0.00' } }
                        ]}
                        rowHeaders={false}
                        width="100%"
                        height={150}
                        colWidths={[80, 200, 200, 250]}
                        className={styles.table}
                        licenseKey="non-commercial-and-evaluation"
                        afterChange={handleAfterChange}
                    />
                </div>

                {/* CEL Table */}
                {celData.length > 0 && (
                    <div className={styles.newTableWrapper}>
                        <h2 className={styles.tableTitle}>CEL</h2>
                        <HotTable
    data={celData}
    colHeaders={['CEL', 'Consumo [MWh]', '13.90%', 'Calculado', '$25.21', 'Tipo']} // Add 'Calculado' header
    columns={[
        { data: 'month', type: 'text', readOnly: true },
        { data: 'consumo', type: 'numeric' },
        { data: 'percentage', type: 'numeric',},
        { data: 'calculatedPercentage', type: 'numeric',  }, // Add calculatedPercentage column
        { data: 'cost', type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
        { data: 'type', type: 'text', readOnly: true }
    ]}
    rowHeaders={false}
    width="100%"
    height={150}
    colWidths={[80, 130, 100, 100, 100, 130]} // Adjust column widths as needed
    licenseKey="non-commercial-and-evaluation"
/>
                    </div>
                )}
            </div>


            <div className={styles.fileInputContainer}>
    <input type="file" onChange={(e) => setFile(e.target.files[0])} className={styles.fileInput} />
</div>
<button onClick={downloadCSV}>Export to CSV</button>


        <div className={styles.tablesSideBySide}>
            {/* Tipo de Cambio Section */}
            <div>
                {exchangeRateData.length > 0 && (
                    <>
                        <h2 className={styles.tableTitle}>Tipo de Cambio USD - MXN</h2>
                        <h3 className={styles.monthTitle}>{getMonthName(exchangeRateData[0].date)}</h3>
                        <div className={styles.exchangeRateTableWrapper}>
                            <HotTable
                                data={exchangeRateData}
                                colHeaders={['Fecha', 'TC']}
                                columns={[
                                    { data: 'date', type: 'text', readOnly: true },
                                    { data: 'rate', type: 'numeric', numericFormat: { pattern: '0,0.00' } }
                                ]}
                                rowHeaders={false}
                                width="100%"
                                height={350}
                                licenseKey="non-commercial-and-evaluation"
                            />
                        </div>
                    </>
                )}
            </div>

          {
exchangeRateData.length > 0 && dailyData.length > 0 && dailyData &&(
    <div className={styles.newTableWrapper}>
        <h2 className={styles.tableTitle}>Cálculo Diario</h2>
        <HotTable
   // key={forceUpdate}
    key={hotTableKey}
    data={dailyData}
    colHeaders={['Fecha', 'Consumo Eléctrico Diario MWh', 'Consumo Eléctrico Diario Excedente', 'Tipo de Cambio', 'MXP/CEL', 'REQCEL',' REQCEL Excedente', 'COSTO DIARIO CEL', 'COSTO DIARIO Excedente']}
    columns={[
        { data: 'date', type: 'text' },
        { data: 'consumption', type: 'numeric' },
        { data: 'consumptionExcedente', type: 'numeric' },
        { data: 'exchangeRate', type: 'numeric', numericFormat: { pattern: '0,0.00' } },
        { data: 'mxpPerCel', type: 'numeric', numericFormat: { pattern: '0,0.000' } },
        { data: 'reqCel', type: 'numeric', numericFormat: { pattern: '0,0.000' } },
        { data: 'reqCelExcedente', type: 'numeric', numericFormat: { pattern: '0,0.000' } },
        { data: 'dailyCostCel', type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
        { data: 'dailyCostCelExcedente', type: 'numeric', numericFormat: { pattern: '$0,0.00' } }
    ]}
    rowHeaders={false}
    width="100%"
    height={300}
    colWidths={[100, 200, 230, 130, 100, 80, 120, 120, 150]}
    licenseKey="non-commercial-and-evaluation"
/>

    </div>
)
}
        </div>
    </div>
);

}

export default Potencias;
 