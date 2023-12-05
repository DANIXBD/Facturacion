import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { HotTable } from '@handsontable/react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import html2pdf from 'html2pdf.js';
import domtoimage from 'dom-to-image';
//import styles from './factura.module.css'; 

ChartJS.register(ArcElement, Tooltip, Legend);

const chartStructure = {
    labels: [

  'Energía Excedente',
  'Potencia',
  'Energía',
  'CEL',
  'CEL Excedente',
  'Tarifas Reguladas',
  'Servicios Complementarios',
  'O&M Red Particular',
  'Desviación pronóstico',
 // 'Bonificación pronóstico',
],
datasets: [
  {
  //  label: 'Factura Breakdown',
  //  data: [/* Array of your data values */],
    backgroundColor: [
      'rgba(255, 99, 132, 0.2)', // red
      'rgba(255, 159, 64, 0.2)', // orange
      'rgba(255, 205, 86, 0.2)', // yellow
      'rgba(75, 192, 192, 0.2)', // green
      'rgba(54, 162, 235, 0.2)', // blue
      'rgba(153, 102, 255, 0.2)', // indigo
      'rgba(201, 203, 207, 0.2)', // violet
      'rgba(0, 0, 0, 0.2)', // black for differentiation
      'rgba(128, 0, 0, 0.2)', // maroon
     // 'rgba(0, 128, 0, 0.2)', // olive
    ],
    borderColor: [
      'rgb(255, 99, 132)', // red
      'rgb(255, 159, 64)', // orange
      'rgb(255, 205, 86)', // yellow
      'rgb(75, 192, 192)', // green
      'rgb(54, 162, 235)', // blue
      'rgb(153, 102, 255)', // indigo
      'rgb(201, 203, 207)', // violet
      'rgb(0, 0, 0)', // black
      'rgb(128, 0, 0)', // maroon
    //  'rgb(0, 128, 0)', // olive
    ],
    borderWidth: 1,
    
  },
],

}
const Factura = () => {

  // Define the helper function to format numbers as currency
const formatCurrency = (value) => {
  if (!value) return '';
  // Convert the string to a number and format it as currency
  const number = parseFloat(value.replace(/[^0-9.-]+/g, ""));
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(number);
};
    
    const getMonthName = (dateStr) => {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const dateParts = dateStr.split('-');
        const monthIndex = parseInt(dateParts[1], 10) - 1; // Months are zero-indexed in JavaScript
        return monthNames[monthIndex];
      };
      

        const [facturaData, setFacturaData] = useState([
            ['Consumo kWH', ''],
            ['Consumo MWh Excedente', ''],
            ['Energía', ''],
            ['Energía Excedente', ''],
            ['Potencia', ''],
            ['CEL', ''],
            ['CEL Excedente', ''],
            ['Tarifas Reguladas', ''],
            ['Servicios Complementarios', ''],
            ['O&M Red Particular', ''],
            ['Desviación pronóstico', ''],
            ['Bonificación pronóstico', ''],
            ['Suma', ''],
            ['IVA', ''],
            ['Total', ''],
            ['$/kWh (solo energía)', '']
        ]);
    
        const [columnHeaders, setColumnHeaders] = useState(['Concepto', 'Mes']); // Default headers


        const handleFileUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
              Papa.parse(file, {
                complete: function(results) {
                  // Assuming the date is in the second row, first column (A9)
                  const dateFromA9 = results.data[9][0];
                  const monthName = getMonthName(dateFromA9);
          
                  // Update column header
                  setColumnHeaders(['Concepto', monthName]);

                        // Define a function to clean the extracted value
                        const cleanValue = (rawValue) => {
                          if (typeof rawValue === 'string') { // Check if the value is a string
                            return rawValue.split('\n')[0].trim();
                          }
                          return ''; // Return an empty string or some default value if it's not a string
                        };
                        
                        // Extract values from specified cells
                        const consumoKWH = results.data[1] && results.data[1][14];
                        const consumoMWhExcedente = results.data[2] && results.data[2][14] ? parseFloat(results.data[2][14]) * 1000 : 0;
                        const energia = results.data[3] && results.data[3][14];
                        const energiaExcedenteRaw = results.data[4] && results.data[4][14];
                        const energiaExcedenteParts = energiaExcedenteRaw ? energiaExcedenteRaw.split('\n') : [];
                        const energiaExcedente = energiaExcedenteParts.length > 0 ? energiaExcedenteParts[0] : '';
                        const lastRowIndex = results.data.length - 1;
                const lastRow = results.data[lastRowIndex];

                const desviacionPronostico = lastRow && lastRow[11] ? lastRow[11].split('\n')[0].trim() : '';
                const bonificacionPronosticoRaw = lastRow && lastRow[10] ? lastRow[10] : '';
                const bonificacionPronosticoParts = bonificacionPronosticoRaw.split('\n');
                const bonificacionPronostico = bonificacionPronosticoParts.length > 1 ? bonificacionPronosticoParts[1].trim() : '';
                      

                    // Make sure the row exists and has enough columns before trying to access the data
const potencia = results.data[751] && results.data[751].length > 3 ? cleanValue(results.data[751][3]) : '';
const cel = results.data[752] && results.data[752].length > 3 ? cleanValue(results.data[752][3]) : '';
const celExcedente = results.data[753] && results.data[753].length > 3 ? cleanValue(results.data[753][3]) : '';
// Log the length of the rows to see if they contain enough columns
console.log(`Row 751 length: ${results.data[751] ? results.data[751].length : 'undefined'}`);
console.log(`Row 752 length: ${results.data[752] ? results.data[752].length : 'undefined'}`);
console.log(`Row 753 length: ${results.data[753] ? results.data[753].length : 'undefined'}`);


        
        
                        // Update the state to reflect the new values
                        setFacturaData(prevData => {
                            const newData = [...prevData];
                            // Find index for each row based on the first column
                            const indexes = {
                                consumoKWH: newData.findIndex(row => row[0] === 'Consumo kWH'),
                                consumoMWhExcedente: newData.findIndex(row => row[0] === 'Consumo MWh Excedente'),
                                energia: newData.findIndex(row => row[0] === 'Energía'),
                                energiaExcedente: newData.findIndex(row => row[0] === 'Energía Excedente'),
                                potencia: newData.findIndex(row => row[0] === 'Potencia'),
                                cel: newData.findIndex(row => row[0] === 'CEL'),
                                celExcedente: newData.findIndex(row => row[0] === 'CEL Excedente'),
                                desviacionPronostico: newData.findIndex(row => row[0] === 'Desviación pronóstico'),
                                bonificacionPronostico: newData.findIndex(row => row[0] === 'Bonificación pronóstico')
                            };
        
                            // Update values if they exist in the CSV
                            if (indexes.consumoKWH !== -1 && consumoKWH) newData[indexes.consumoKWH][1] = consumoKWH;
                            if (indexes.consumoMWhExcedente !== -1) newData[indexes.consumoMWhExcedente][1] = consumoMWhExcedente.toFixed(2);
                            if (indexes.energia !== -1 && energia) newData[indexes.energia][1] = energia;
                            if (indexes.energiaExcedente !== -1 && energiaExcedente) newData[indexes.energiaExcedente][1] = energiaExcedente;
                            if (indexes.potencia !== -1 && potencia) newData[indexes.potencia][1] = potencia;
                            if (indexes.cel !== -1 && cel) newData[indexes.cel][1] = cel;
                            if (indexes.celExcedente !== -1 && celExcedente) newData[indexes.celExcedente][1] = celExcedente;
                            if (indexes.desviacionPronostico !== -1) newData[indexes.desviacionPronostico][1] = desviacionPronostico;
                            if (indexes.bonificacionPronostico !== -1) newData[indexes.bonificacionPronostico][1] = bonificacionPronostico;
        
                            calculateSumaIVAAndTotal(newData);
                            return newData;
                        });
                    },
                    header: false,
                    skipEmptyLines: true
                });
            }
        };
        

        const handleCombinedDataUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                Papa.parse(file, {
                    complete: function(results) {
                        console.log('Parsed combined data CSV:', results.data);
        
                        // Target the 749th row (index 748) for the relevant data
                        const targetRow = results.data[748];
                        if (targetRow && targetRow.length >= 25) {
                            const tarifasReguladas = parseFloat(targetRow[22]) + parseFloat(targetRow[23]); // C763 and D763
                            const serviciosComplementarios = parseFloat(targetRow[24]); // E763
        
                            console.log('Tarifas Reguladas:', tarifasReguladas);
                            console.log('Servicios Complementarios:', serviciosComplementarios);
        
                            setFacturaData(prevData => {
                                const newData = [...prevData];
                                const indexes = {
                                    tarifasReguladas: newData.findIndex(row => row[0] === 'Tarifas Reguladas'),
                                    serviciosComplementarios: newData.findIndex(row => row[0] === 'Servicios Complementarios'),
                                    omRedParticular: newData.findIndex(row => row[0] === 'O&M Red Particular')
                                };
                                 // Update the values
                    if (indexes.tarifasReguladas !== -1) newData[indexes.tarifasReguladas][1] = isNaN(tarifasReguladas) ? '' : tarifasReguladas.toFixed(2);
                    if (indexes.serviciosComplementarios !== -1) newData[indexes.serviciosComplementarios][1] = isNaN(serviciosComplementarios) ? '' : serviciosComplementarios.toFixed(2);
                    if (indexes.omRedParticular !== -1) newData[indexes.omRedParticular][1] = "11,555.12";  // Set the constant value

                    calculateSumaIVAAndTotal(newData);
                                // Apply currency formatting to the specific rows
  const fieldsToFormat = [
    'Energía',
    'Energía Excedente',
    'Potencia',
    'CEL',
    'CEL Excedente',
    'Tarifas Reguladas',
    'Servicios Complementarios',
    'O&M Red Particular',
    'Desviación pronóstico',
    'Bonificación pronóstico',
    'Suma',
    'IVA',
    'Total',
    '$/kWh (solo energía)'
  ];

  return newData.map(row => {
    if (fieldsToFormat.includes(row[0])) {
      return [row[0], formatCurrency(row[1])];
    }
    return row;
  });
                                
                            });
                            
                        } else {
                            console.log('Relevant row not found in the CSV.');
                        }
                    },
                    header: false,
                    skipEmptyLines: true
                });
            }
        };
        
        const calculateSumaIVAAndTotal = (data) => {
            const sumFields = ['Energía', 'Energía Excedente', 'Potencia', 'CEL', 'CEL Excedente', 'Tarifas Reguladas', 'Servicios Complementarios', 'O&M Red Particular', 'Desviación pronóstico', 'Bonificación pronóstico'];
            let sum = 0;
            let allFieldsHaveData = true;
        
            sumFields.forEach(field => {
                const rowIndex = data.findIndex(row => row[0] === field);
                if (rowIndex !== -1 && data[rowIndex][1]) {
                    sum += parseFloat(data[rowIndex][1].replace(/[^0-9.-]+/g,"")) || 0;
                } else {
                    allFieldsHaveData = false;
                }
            });
        
            if (allFieldsHaveData) {
                const sumaIndex = data.findIndex(row => row[0] === 'Suma');
                const ivaIndex = data.findIndex(row => row[0] === 'IVA');
                const totalIndex = data.findIndex(row => row[0] === 'Total');
        
                if (sumaIndex !== -1 && ivaIndex !== -1 && totalIndex !== -1) {
                    data[sumaIndex][1] = sum.toFixed(2);
                    data[ivaIndex][1] = (sum * 0.16).toFixed(2); // IVA calculation
                    data[totalIndex][1] = (sum + sum * 0.16).toFixed(2); // Total calculation
                }
            }

               // Calculate $/kWh (solo energía)
    const energiaIndex = data.findIndex(row => row[0] === 'Energía');
    const energiaExcedenteIndex = data.findIndex(row => row[0] === 'Energía Excedente');
    const consumoKWHIndex = data.findIndex(row => row[0] === 'Consumo kWH');
    const consumoMWhExcedenteIndex = data.findIndex(row => row[0] === 'Consumo MWh Excedente');
    const dollarPerKWhIndex = data.findIndex(row => row[0] === '$/kWh (solo energía)');

    if (energiaIndex !== -1 && energiaExcedenteIndex !== -1 && consumoKWHIndex !== -1 && consumoMWhExcedenteIndex !== -1 && dollarPerKWhIndex !== -1) {
        const totalEnergia = parseFloat(data[energiaIndex][1].replace(/[^0-9.-]+/g,"")) + parseFloat(data[energiaExcedenteIndex][1].replace(/[^0-9.-]+/g,""));
        const totalConsumo = parseFloat(data[consumoKWHIndex][1].replace(/[^0-9.-]+/g,"")) + parseFloat(data[consumoMWhExcedenteIndex][1].replace(/[^0-9.-]+/g,""));

        if (totalConsumo > 0) {
            data[dollarPerKWhIndex][1] = ((totalEnergia / totalConsumo) / 1000).toFixed(4); // Dividing by 100 and assuming 4 decimal places
        }
    }
        };


        const [chartData, setChartData] = useState({
            labels: chartStructure.labels,
            datasets: [{ data: [] }]
          });
        
          useEffect(() => {
            const chartValues = chartStructure.labels.map(label => {
              const rowIndex = facturaData.findIndex(row => row[0] === label);
              return rowIndex !== -1 ? parseFloat(facturaData[rowIndex][1].replace(/[^0-9.-]+/g, "")) || 0 : 0;
            });
        
            setChartData({
              labels: chartStructure.labels,
              datasets: [
                {
                  ...chartStructure.datasets[0],
                  data: chartValues,
                },
              ],
            });
          }, [facturaData]);
              
          
              const chartOptions = {
                maintainAspectRatio: false, 
                responsive: true, 
              };


              const exportToCSV = () => {
                // Create an array of objects for Papa.unparse
                const dataForCSV = facturaData.map((row, index) => {
                  if (index === 0) return null; // Skip the first row which contains headers
                  return { [columnHeaders[0]]: row[0], [columnHeaders[1]]: row[1] };
                }).filter(row => row); // Remove the null entry
              
                // Convert data to CSV string
                const csv = Papa.unparse(dataForCSV, {
                  header: true, // Include header row in the CSV
                });
              
                // Create a Blob for the CSV file
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              
                // Create a link to download the blob
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'factura_data.csv';
                link.click();
              
                // Clean up
                URL.revokeObjectURL(link.href);
              };
              
              const exportToPDF = async () => {
                const tableContent = document.getElementById('pdf-table-content');
                const chartContent = document.getElementById('pdf-chart-content');
              
                const combinedContent = document.createElement('div');
                combinedContent.appendChild(tableContent.cloneNode(true));
              
                // Render the chart as an image
                const chartImage = await domtoimage.toPng(chartContent);
                const chartImageElement = document.createElement('img');
                chartImageElement.src = chartImage;
                combinedContent.appendChild(chartImageElement);
              
                const pdfOptions = {
                  margin: 10,
                  filename: 'factura.pdf',
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2 },
                  jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape', width: 300 },
                };
              
                // Export the combined content to PDF
                html2pdf().from(combinedContent).set(pdfOptions).save();
              };
              
              
              



             return (
  <div className="container">
    <h1>Factura</h1>
    <label htmlFor="final-data-upload">Subir final data:</label>
    <input type="file" accept=".csv" onChange={handleFileUpload} id="final-data-upload" />
    <label htmlFor="combined-data-upload">Subir combined data:</label>
    <input type="file" accept=".csv" onChange={handleCombinedDataUpload} id="combined-data-upload" />
    <button onClick={exportToCSV}>Export to CSV</button>
    <button onClick={exportToPDF}>Export to PDF</button>

    <div id="pdf-table-content" className="table-container">
      {/* Render the HotTable for factura */}
      <HotTable
        data={facturaData}
        colHeaders={columnHeaders}
        columns={[
          { data: 0, type: 'text', className: 'htLeft' }, // Align text to the left
          { data: 1, type: 'text', className: 'htRight' } // Align numbers to the right
        ]}
        rowHeaders={false}
        colWidths={[625, 625]}
        height="auto"
        stretchH="none"
        licenseKey="non-commercial-and-evaluation"
      />
    </div>

    <div id="pdf-chart-content" className="chart-container">
      <Pie data={chartData} options={chartOptions} />
    </div>
  </div>
);

            
    };

    
    export default Factura;