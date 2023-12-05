import React, { useState } from 'react';
import Papa from 'papaparse';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import styles from './WMAPE.module.css';

const WMAPE = () => {


    const [previousCSVData, setPreviousCSVData] = useState([]);
    const [otherCSVData, setOtherCSVData] = useState([]);
    const [renderKey, setRenderKey] = useState(0);
    const [wmapeData, setWmapeData] = useState([]); // State to hold wmapeData
    const [originalPreviousCSVContent, setOriginalPreviousCSVContent] = useState('');
const [originalOtherCSVContent, setOriginalOtherCSVContent] = useState('');


    // Define the column settings for the WMAPE table
    
    // Define the column settings for the Total table
    const [totalData, setTotalData] = useState({
        total_bonificacion: 0,
        total_desviacion: 0
    });

    const isSecondFormat = (data) => {
        // Count the number of initial consecutive empty rows
        let emptyRowCount = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i].every(cell => cell === "")) {
                emptyRowCount++;
            } else {
                break; // Stop counting once a non-empty row is found
            }
        }
    
        // If there are fewer than 4 empty rows, assume it's the second format
        return emptyRowCount < 4;
    };
    

    const transformCSVData = (data) => {
        // Determine the format: if the first cell of the 5th row includes a comma, it's the wrong format
        const isWrongFormat = data[4][0].includes(",");
    
        // Find the row index where actual data starts
        const dataStartIndex = isWrongFormat ? 
            data.findIndex(row => row[0].startsWith('fecha')) + 1 : 
            data.findIndex(row => row.includes('fecha')) + 1;
    
        // Extract the summary rows and actual data rows
        const dataRows = data.slice(dataStartIndex);
    
        // Transform data rows
        return dataRows.map(row => {
            // For the wrong format, split the 'fecha' and 'hora'
            if (isWrongFormat) {
                const [fechaHora, ...rest] = row;
                const [fecha, hora] = fechaHora.split(",");
                return [fecha, hora, ...rest];
            }
            return row;
        });
    };
    
  const normalizeDate = (dateStr) => {
    let normalizedDate = dateStr;
    // Check if the date format is 'YYYY-MM-DD'
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // Convert 'YYYY-MM-DD' to 'DD-MM-YY'
        const parts = dateStr.split('-');
        normalizedDate = `${parts[2]}-${parts[1]}-${parts[0].substring(2)}`; // Use substring to get the last two digits of the year
    }
    return normalizedDate;
};
    

    const updateTotalData = (wmapeData) => {
        let totalBonificacion = 0;
        let totalDesviacion = 0;
        const bonificationByDate = new Map();
    
        wmapeData.forEach(row => {
            // Update total for Desviación
            totalDesviacion += parseFloat(row.cargo_total_desviacion || 0);
    
            // Aggregate Bonificación by date
            const fecha = row.fecha;
            const bonificacion = parseFloat(row.bonificacion || 0);
    
            if (bonificationByDate.has(fecha)) {
                bonificationByDate.set(fecha, bonificationByDate.get(fecha) + bonificacion);
            } else {
                bonificationByDate.set(fecha, bonificacion);
            }
        });
    
        // Sum Bonificación for the first 30 unique dates
        let uniqueDatesCounted = 0;
        for (let [date, bonification] of bonificationByDate) {
            if (uniqueDatesCounted < 30) {
                totalBonificacion += bonification;
                uniqueDatesCounted++;
            } else {
                break;
            }
        }
    
        setTotalData({
            total_bonificacion: totalBonificacion,
            total_desviacion: totalDesviacion
        });
    };
    


 
    const parseCSV = (file, setData) => {
        Papa.parse(file, {
            header: false,
            skipEmptyLines: false,
            complete: function(results) {
                console.log("Initial parsed data:", results.data); 
    
                let data;
                let dataStartIndex;
    
                if (isSecondFormat(results.data)) {
                    console.log("Data is in the second format, transforming...");
                    data = transformCSVData(results.data);
                    dataStartIndex = 5; // Set the starting index for the wrong format
                } else {
                    data = results.data;
                    dataStartIndex = 8; // Set the starting index for the correct format
                }
    
                console.log("Data after format check:", data); // Log data after format check
    
                const filteredData = [];
                let emptyFieldStreak = 0;
    
                for (const row of data.slice(dataStartIndex)) {
                    // Clean up each cell in the row
                    const cleanedRow = row.map(cell => cell.split('\n')[0].trim());
                    console.log("Processing cleaned row:", cleanedRow); 
    
                    // Existing filtering logic, using cleanedRow instead of row
                    if (
                        cleanedRow[0].trim() === '' && cleanedRow[1].trim() === '' &&
                        cleanedRow[2].trim() === '' && cleanedRow[3].trim() === '' &&
                        (cleanedRow[8].trim() === '' || isNaN(cleanedRow[8]))
                    ) {
                        emptyFieldStreak++;
                    } else {
                        emptyFieldStreak = 0; // Reset if any field has data
                    }
    
                    if (emptyFieldStreak >= 5 || isNaN(cleanedRow[8])) {
                        console.log("Breaking loop at row:", cleanedRow);
                        break;
                    }
    
                    if (emptyFieldStreak === 0 && !isNaN(cleanedRow[8])) {
                        const parsedRow = {
                            fecha: normalizeDate(cleanedRow[0]),
                            hora: cleanedRow[1],
                            pml_mda: cleanedRow[2],
                            pml_mtr: cleanedRow[3],
                            consumo_mwh: cleanedRow[9] // Ensure this index is correct for your data
                        };
    
                        filteredData.push(parsedRow);
                    }
                }
    
                console.log("Filtered data:", filteredData); // Log final filtered data
                setData(filteredData);
            },
            error: function(error) {
                console.error('Error while parsing CSV:', error);
            }
        });
    };
    
    
    
    
    

    const parseOtherCSV = (file, wmapeData, setWmapeData) => {
        // Function to calculate APE Simple
        const calculateAPESimple = (consumoMWh, pronosticoMWh) => {
            if (consumoMWh === 0 && pronosticoMWh === 0) {
                return 0; // 0% when both are zero
            } else if (consumoMWh === 0 && pronosticoMWh > 0) {
                return 1; // 100% when consumo is zero but pronostico is greater than zero
            } else {
                return Math.abs(consumoMWh - pronosticoMWh) / consumoMWh; // The absolute percentage error calculation
            }
        };
    
        // Function to calculate MAPE Ponderado por Consumo
        const calculateMAPEPonderado = (wmapeData) => {
            let sumProduct = 0;
            let sumConsumo = 0;
            const uniqueDates = new Set();
    
            for (const row of wmapeData) {
                if (uniqueDates.size === 31) {
                    break; // Stop processing if 30 unique days are already counted
                }
    
                const fecha = row.fecha;
                if (!uniqueDates.has(fecha)) {
                    uniqueDates.add(fecha);
                }
    
                const consumo = parseFloat(row.consumo_mwh);
                const apeSimple = parseFloat(row.ape_simple);
    
                if (!isNaN(consumo) && !isNaN(apeSimple)) {
                    sumProduct += consumo * apeSimple;
                    sumConsumo += consumo;
                }
            }
    
            return sumConsumo ? sumProduct / sumConsumo : 0;
        };
    
        // Function to calculate Bonificación (MXN)
        const calculateBonificacion = (consumoMWh, mapePonderado) => {
            return mapePonderado <= 0.10 ? (10 * consumoMWh) * -1 : 0;
        };

        // Function to calculate Energía a Desviación
    const calculateEnergiaDesviacion = (consumoMWh, pronosticoMWh) => {
        return consumoMWh - pronosticoMWh;
    };
       // Function to calculate Cargo Total por Desviación
       const calculateCargoTotalDesviacion = (energiaDesviacion, pmlMTR, pmlMDA) => {
        return energiaDesviacion * (pmlMTR - pmlMDA);
    };
    
        Papa.parse(file, {
            header: false,
            complete: function(results) {
                const dateRow = results.data[10]; // Row 11, where dates are located
                const foundDates = [];
    
                for (let i = 1; i < dateRow.length; i++) { // Assuming dates start from column B (index 1)
                    const date = dateRow[i];
                    if (isDateInWmapeData(date, wmapeData)) {
                        foundDates.push(date);
                    }
                }
    
                let isDataUpdated = false;
    
                foundDates.forEach(date => {
                    const columnIndex = dateRow.findIndex(d => d === date);
    
                    results.data.slice(12, 36).forEach((row, index) => {
                        const hour = index + 1;
                        const rawValue = row[columnIndex];
                        const value = rawValue ? parseFloat(rawValue) / 1000 : null;
    
                        const matchingRowIndex = wmapeData.findIndex(wmapeRow => wmapeRow.fecha === date && wmapeRow.hora == hour);
                        if (matchingRowIndex !== -1) {
                            wmapeData[matchingRowIndex].pronostico_mwh = value;
    
                            // Calculate and update APE Simple
                            const apeSimple = calculateAPESimple(
                                parseFloat(wmapeData[matchingRowIndex].consumo_mwh),
                                value
                            );
                            wmapeData[matchingRowIndex].ape_simple = apeSimple;
    
                            isDataUpdated = true;
                        }
                    });
                });
    
                if (isDataUpdated) {
                    // Calculate MAPE Ponderado por Consumo and apply it to all rows
                    const mapePonderado = calculateMAPEPonderado(wmapeData);
                    const updatedWmapeData = wmapeData.map(row => {
                        const consumoMWh = parseFloat(row.consumo_mwh);
                        const pronosticoMWh = parseFloat(row.pronostico_mwh);
                        const pmlMDA = parseFloat(row.pml_mda);
                        const pmlMTR = parseFloat(row.pml_mtr);
                        const bonificacion = calculateBonificacion(consumoMWh, mapePonderado);
                        const energiaDesviacion = calculateEnergiaDesviacion(consumoMWh, pronosticoMWh);
                        const cargoTotalDesviacion = calculateCargoTotalDesviacion(energiaDesviacion, pmlMTR, pmlMDA);
                        
                    
                
    
                        return {
                            ...row,
                            mape_ponderado: mapePonderado,
                            bonificacion: bonificacion,
                            energia_desviacion: energiaDesviacion,
                            cargo_total_desviacion: cargoTotalDesviacion
                        };
                    });
    
                    setWmapeData(updatedWmapeData); // Update the state with new data
                    console.log("Updated WMAPE Data:", updatedWmapeData);
                        updateTotalData(updatedWmapeData); // Update total data based on new wmapeData
                        setRenderKey(prevKey => prevKey + 1); // Increment the render key to force re-render
                }
            },
            error: function(error) {
                console.error('Error while parsing other CSV:', error);
            }
        });
    };
    
    
    
    const isDateInWmapeData = (date, wmapeData) => {
        const normalizedCsvDate = normalizeDate(date);
        return wmapeData.some(row => normalizeDate(row.fecha) === normalizedCsvDate);
    };
    
    
    
    const handlePreviousCSVUpload = (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.error("No file selected.");
            return;
        }
    
        const reader = new FileReader();
        reader.onload = (e) => {
            const rawContent = e.target.result;
            setOriginalPreviousCSVContent(rawContent); // Save the original file content
            parseCSV(rawContent, setPreviousCSVData); // Parse the CSV data
        };
        reader.readAsText(file);
    };
    
    
        const handleOtherCSVUpload = (event) => {
            const file = event.target.files[0];
            if (!file) {
                console.error("No file selected.");
                return;
            }
            parseOtherCSV(file, previousCSVData, setPreviousCSVData);
        };

        
        const convertTotalDataToCSVText = (totalData) => {
            // Define the headers
            const headers = ['Total Bonificación', 'Total Desviación'];
        
            // Convert the headers array to a CSV string
            const headersCSV = headers.join(',');
        
            // Convert the data row to a CSV string
            const dataCSV = totalData.total_bonificacion.toFixed(2) + ',' + totalData.total_desviacion.toFixed(2);
        
            // Combine headers and data
            return headersCSV + '\n' + dataCSV;
        };

        const convertWmapeDataToCSVText = (wmapeData) => {
            // Define the headers for the WMAPE table
            const headers = [
                'Fecha', 'Hora', 'Consumo MWh', 'Pronostico MWh', 'PML MDA', 'PML MTR', 
                'APE Simple', 'MAPE Ponderado', 'Bonificación', 'Energía Desviación', 'Cargo Total Desviación'
            ];
        
            // Convert the headers array to a CSV string
            const headersCSV = headers.join(',');
        
            // Reverse the data if needed and convert each row to a CSV string
            const csvRows = wmapeData.slice().reverse().map(row => {
                return [
                    row.fecha, row.hora, row.consumo_mwh, row.pronostico_mwh, row.pml_mda, row.pml_mtr, 
                    row.ape_simple, row.mape_ponderado, row.bonificacion, row.energia_desviacion, row.cargo_total_desviacion
                ].map(String).join(',');
            });
        
            // Combine headers and data rows
            return [headersCSV, ...csvRows].join('\n');
        };
        
        
        
        
        const exportCombinedCSV = () => {
            // Convert the Total table data to CSV format
            const totalCSVText = convertTotalDataToCSVText(totalData);
        
            // Count the number of lines in the original content
            const lineCount = originalPreviousCSVContent.split('\n').length;
        
            // Calculate how many blank lines to add to reach row 880
            const blankLinesNeeded = Math.max(0, 880 - lineCount - 1); // Subtract 1 for the header row of the total table
        
            // Create blank lines
            const blankLines = Array(blankLinesNeeded).fill('').join('\n');
        
            // Combine the original file content, blank lines, and Total data
            const combinedCSVContent = originalPreviousCSVContent + '\n' + blankLines + '\n' + totalCSVText;
        
            // Create a Blob and download the combined CSV content
            const blob = new Blob([combinedCSVContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
        
            // Create and trigger the download link
            const link = document.createElement('a');
            link.href = url;
            link.download = 'final-data.csv'; // Suggested filename for the downloaded file
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        
        
        
        
        
        
        

        
        console.log("Data being passed to HotTable:", previousCSVData);


    return (
        <div>
            
            
            <h1 className="centered-text">WMAPE</h1>

          
                <label htmlFor="previousCSV">Subir CSV:</label>
                <input
                    type="file"
                    id="previousCSV"
                    name="previousCSV"
                    accept=".csv"
                    onChange={handlePreviousCSVUpload}
                />
            
            
                <label htmlFor="otherCSV">Subir pronostico CSV:</label>
                                <input
                    type="file"
                    id="otherCSV"
                    name="otherCSV"
                    accept=".csv"
                    onChange={handleOtherCSVUpload} // Ensure this is correctly set
                />

<button onClick={exportCombinedCSV}>Export to CSV</button>

                <h2>Total</h2>
                <HotTable
    data={[totalData]}
    colHeaders={['Total Bonificación', 'Total Desviación']}
    columns={[
        { data: 'total_bonificacion', type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
        { data: 'total_desviacion', type: 'numeric', numericFormat: { pattern: '$0,0.00' } }
    ]}
    rowHeaders={false}
    width="100%"
    height="auto"
    stretchH="all"
    licenseKey="non-commercial-and-evaluation" 
/>

<h2>WMAPE Data</h2>
<HotTable
key={wmapeData} 
data={previousCSVData}
    colHeaders={[
        'Fecha',
        'Hora',
        'Consumo (MWh)',
        'Pronostico (MWh)',
        'PML MDA',
        'PML MTR',
        'APE Simple',
        'MAPE Ponderado por Consumo',
        'Bonificación (MXN)',
        'Energía a Desviación (MAPE>10%) (MXN/MWh)',
        'Cargo Total por Desviación'
    ]}
    columns={[
        { data: 'fecha', type: 'text', dateFormat: 'YYYY-MM-DD', correctFormat: true,  },
        { data: 'hora', type: 'text', timeFormat: 'HH:mm', correctFormat: true,  },
        { data: 'consumo_mwh', type: 'numeric', numericFormat: { pattern: '0,0.00000' } },
        { data: 'pronostico_mwh', type: 'numeric', numericFormat: { pattern: '0,0.0000' } },
        { data: 'pml_mda', type: 'numeric', numericFormat: { pattern: '0,0.00' } },
        { data: 'pml_mtr', type: 'numeric', numericFormat: { pattern: '0,0.00' } },
        { data: 'ape_simple', type: 'numeric', numericFormat: { pattern: '0,0.00%' } },
        { data: 'mape_ponderado', type: 'numeric', numericFormat: { pattern: '0,0.00%' } },
        { data: 'bonificacion', type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
        { data: 'energia_desviacion', type: 'numeric', numericFormat: { pattern: '0,0.00000' } },
        { data: 'cargo_total_desviacion', type: 'numeric', numericFormat: { pattern: '$0,0.00' } }
    ]}
colWidths={[65, 40, 120, 120, 100, 100, 120, 190, 150, 290, 180]} // Example widths in pixels
rowHeaders={false}
width="100%"
height="auto"
stretchH="all"
licenseKey="non-commercial-and-evaluation"
/>

        </div>
    );
};

export default WMAPE;