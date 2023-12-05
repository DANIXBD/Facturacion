import React, { useState, useCallback } from 'react';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import styles from './regulados.module.css'; 
import { registerCellType, NumericCellType } from 'handsontable/cellTypes';

// Register the cell type
registerCellType(NumericCellType.CELL_TYPE, NumericCellType);

function Regulados() {
  const [selectedYear, setSelectedYear] = useState('2023');
  const [data, setData] = useState([{ concepto: '2023', transmision: 0.0772, operacionCENACE: 6.3286, serviciosComplementarios: 0.2 }]);
  const [monthlyData, setMonthlyData] = useState([
    { mes: '', consumo: '', transmision: '', operacionCENACE: '', serviciosComplementarios: '', total: '' }
  ]);
  const [originalCSV, setOriginalCSV] = useState('');

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    // Assuming you have a yearData object somewhere in your scope or you can import it
    const yearData = {
      '2023': { transmision: 0.0772, operacionCENACE: 6.3286, serviciosComplementarios: 0.2 },
      '2024': { transmision: 1.0772, operacionCENACE: 6.3286, serviciosComplementarios: 0.2 },
      // ... other years
    };
    const selectedData = yearData[e.target.value];
    if (selectedData) {
      setData([{ concepto: e.target.value, ...selectedData }]);
    }
  };


   // Function to convert table data to CSV format
   function convertToCSV(arr) {
    const array = [Object.keys(arr[0])].concat(arr);
    return array.map(it => {
      return Object.values(it).toString();
    }).join('\n');
  }
  const monthNumberToSpanish = (monthNumber) => {
    const monthsInSpanish = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthsInSpanish[parseInt(monthNumber, 10) - 1];
  };
  

  function parseCSVAndExtractData(csvText) {
    console.log("Preparing to extract data...");
    const rows = csvText.trim().split('\n');
    let fechaIndex = -1;
    let totalIndex = -1;
    let totalRowIndex = -1;  // This will hold the row index where "Total" is found
    let fechaRowIndex = -1;
  
    // Find the indices for "fecha" and "Total" in the CSV
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].split(',');
  
      // Check each cell for "Total"
      if (totalIndex === -1) {  // Only search for "Total" if it's not found yet
        for (let j = 0; j < cells.length; j++) {
          if (cells[j].trim() === "Total") {
            totalIndex = j;
            totalRowIndex = i;  // Store the row index
            console.log(`"Total" found at row ${i} and column index ${totalIndex}`);
            break;
          }
        }
      }
  
      if (cells.includes("fecha")) {
        fechaIndex = cells.indexOf("fecha");
        fechaRowIndex = i;
        console.log(`"fecha" found at row ${i} and column index ${fechaIndex}`);
        break;
      }
    }
  
    if (fechaIndex === -1 || totalIndex === -1 || fechaRowIndex === -1 || totalRowIndex === -1) {
      throw new Error('"fecha" or "Total" headers are not in the expected columns.');
    }
  
    
    // Extracting data starting from the row that contains "fecha"
    const firstDateRow = rows[fechaRowIndex + 1].split(',');
    const firstTotalRow = rows[totalRowIndex + 1].split(','); // Get the row immediately after the "Total" header
    const secondTotalRow = rows[totalRowIndex + 2].split(','); // Get the second row after the "Total" header
  
    console.log("Row for fecha:", firstDateRow);
    console.log("Row for first total:", firstTotalRow);
    console.log("Row for second total:", secondTotalRow);
  
    const firstDate = firstDateRow[fechaIndex];
    const firstTotal = parseFloat(firstTotalRow[totalIndex]) || 0; // default to 0 if not a number
    const secondTotal = parseFloat(secondTotalRow[totalIndex]) || 0; // default to 0 if not a number
  
    const totalSum = firstTotal + secondTotal;
    const monthNumber = firstDate.split('-')[1]; // Assuming date format is DD-MM-YYYY
    const monthInSpanish = monthNumberToSpanish(monthNumber);
  
    // Return the data in a format suitable for setting the state for your table
    return [{
      mes: monthInSpanish,
      consumo: totalSum, // Assuming this is the correct field
      // ... other fields with default or empty values as necessary
    }];
  }
  
// Function to calculate 'transmision', 'operacionCENACE', 'serviciosComplementarios', and 'total' based on 'consumo'
const calculateCosts = (rowData) => {
    const transmisionRate = data[0].transmision;
    const operacionCENACERate = data[0].operacionCENACE;
    const serviciosComplementariosRate = data[0].serviciosComplementarios;
    const newConsumo = Number(rowData.consumo);
  
    // Calculate the new 'transmision' based on the provided formula.
    const newTransmision = (newConsumo * 1000) * transmisionRate;
  
    // Calculate the new 'operacionCENACE' based on the provided formula.
    const newOperacionCENACE = newConsumo * operacionCENACERate;
  
    // Calculate the new 'serviciosComplementarios' based on the provided formula.
    const newServiciosComplementarios = (newConsumo * 1000) * serviciosComplementariosRate;
  
    // Calculate the 'total' by adding 'transmision', 'operacionCENACE', and 'serviciosComplementarios'.
    const newTotal = newTransmision + newOperacionCENACE + newServiciosComplementarios;
  
    // Return the updated row data
    return {
      ...rowData,
      transmision: newTransmision,
      operacionCENACE: newOperacionCENACE,
      serviciosComplementarios: newServiciosComplementarios,
      total: newTotal,  // new field for the total
    };
  };
  
  function downloadCSV() {
    const table1CSV = convertToCSV(data); // convert first table data
    const table2CSV = convertToCSV(monthlyData); // convert second table data
    
    // Count the number of lines in the original CSV
    const originalLinesCount = originalCSV.split('\n').length;
    
    // Calculate how many blank lines we need to add to reach row 760
    const paddingLines = 760 - originalLinesCount - 2; // Subtracting 2 for the extra line breaks we're adding between tables
    
    // Create a string with the necessary number of blank lines
    const padding = Array(paddingLines).fill('').join('\n');
    
    const combinedCSV = `${originalCSV}\n${padding}\n${table1CSV}\n\n${table2CSV}`;

    // Create a hidden 'a' element to trigger the download
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURI(combinedCSV);
    link.setAttribute('download', 'combined_data.csv');
    document.body.appendChild(link);

    link.click(); // Trigger click event to start the download

    document.body.removeChild(link); // Clean up by removing the element
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
  
    reader.onload = (e) => {
      const text = e.target.result;
      setOriginalCSV(text); // Store the original CSV data
      try {
        const parsedData = parseCSVAndExtractData(text); // parsedData is already an array
        // Calculate 'transmision', 'operacionCENACE', 'serviciosComplementarios', and 'total' for each row in parsedData
        const updatedData = parsedData.map(rowData => calculateCosts(rowData));
        setMonthlyData(updatedData);
  
      } catch (error) {
        console.error('Error parsing CSV or updating data', error);
      }
    };
  
    reader.readAsText(file);
  };
  

  const onAfterChange = (changes, source) => {
    // Check if changes is not null or undefined before proceeding
    if (!changes || source === 'loadData') {
      return; // This means the change was triggered by loading data, not user action, or no changes were made. We don't need to recalculate.
    }
  
    // Since 'changes' is an array of changes and each change is an array [row, prop, oldValue, newValue],
    // we can use array destructuring to get these values.
    changes.forEach(([row, prop, oldValue, newValue]) => {
      if (prop === 'consumo' && oldValue !== newValue) { // This means the change happened in the 'consumo' column.
        // We retrieve the entire row that has been modified from monthlyData
        const modifiedRow = monthlyData[row];
  
        // We calculate the new costs based on the new 'consumo'
        const updatedRow = calculateCosts(modifiedRow);
  
        // We make a copy of the current 'monthlyData' because we should never mutate the state directly.
        const updatedMonthlyData = [...monthlyData];
  
        // We replace the modified row with the new calculated data.
        updatedMonthlyData[row] = updatedRow;
  
        // And finally, we call 'setMonthlyData' to update the state with the new values.
        setMonthlyData(updatedMonthlyData);
      }
    });
  };
  
 
  
  
  

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Regulados y Extra</h1>
      <div>
        <label>Select Year: </label>
        <select value={selectedYear} onChange={handleYearChange}>
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          {/* Add more <option> elements for more years as needed */}
        </select>
      </div>
      <div className="tableContainer">
        <HotTable
          data={data}
          colHeaders={['Concepto', 'Transmisión (centro de carga) ($/kWh)', 'Operación CENACE (centro de carga) ($/kWh)', 'Servicios Complementarios']}
          columns={[
            { data: 'concepto', type: 'text', readOnly: true },
            { data: 'transmision', type: 'numeric', numericFormat: { pattern: '0.0000' } },
            { data: 'operacionCENACE', type: 'numeric', numericFormat: { pattern: '0.0000' } },
            { data: 'serviciosComplementarios', type: 'numeric', numericFormat: { pattern: '0.0000' } }
          ]}
          rowHeaders={false}
          width="100%"
          height={108}
          colWidths={[120, 300, 300, 300]}
          className="columnHeader"
          licenseKey="non-commercial-and-evaluation"
        />
      </div>
      

      {/* File input for CSV */}
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
      />
       {/* Button for user to download combined CSV */}
       <button onClick={downloadCSV}>Exportar a CSV</button>

      {/* Second table */}
      <div className={styles.container}>
        <HotTable
          data={monthlyData}
          colHeaders={['Mes', 'Consumo MWh', 'Transmisión', 'Operación CENACE', 'Servicios Complementarios', 'Total']}
          columns={[
            { data: 'mes', type: 'text' },
            { data: 'consumo', type: 'numeric', numericFormat: { pattern: '0.00' } },
            { data: 'transmision', type: 'numeric', numericFormat: { pattern: '0.00' } },
            { data: 'operacionCENACE', type: 'numeric', numericFormat: { pattern: '0.00' } },
            { data: 'serviciosComplementarios', type: 'numeric', numericFormat: { pattern: '0.00' } },
            { data: 'total', type: 'numeric', readOnly: true, numericFormat: { pattern: '0.00' } } // assuming total is calculated and not manually entered
          ]}
          rowHeaders={false}
          width="100%"
          height={108}
          colWidths={[120, 200, 200, 200, 200, 200]}
          licenseKey="non-commercial-and-evaluation"
          afterChange={onAfterChange} // Adding the afterChange hook here
        />
      </div>
    </div>
  );
}

export default Regulados;


