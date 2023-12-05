import React, { useState, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import Papa from 'papaparse';
import 'react-dates/initialize';
import { DateRangePicker } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';
import moment from 'moment';
import backgroundImage from './background/simplify_logo.png'; 

const Consumos = () => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [focusedInput, setFocusedInput] = useState(null);
    const [KWcontratadoValue, setKWcontratadoValue] = useState('');
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);

    const [summary, setSummary] = useState({
        totalMWhHora: 0,
        totalMWhExcedente: 0,
        totalFacturacionEstimada: 0,
        totalFacturacionEstimadaExcedente: 0
    });

    const fetchData = async () => {
        if (startDate && endDate) {
          // Format the dates
          const formattedStartDate = startDate.format('YYYY-MM-DD');
          const formattedEndDate = endDate.format('YYYY-MM-DD');
      
          const url = `http://localhost:5000/api/fetch_external?start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
          try {
    
                const response = await fetch(url);
                const jsonData = await response.json();
                const extractedDataMDA = jsonData.MDA[0].Valores.map(item => ({
                  fecha: item.fecha,
                  hora: item.hora,
                  MDA: item.pml,
                  MTR: '', 
                  KWcontratado: KWcontratadoValue,
                  MWhHora: '',
                  MWhExcedente: '',
                  FacturacionEstimada: '',
                  FacturacionEstimadaExcedente: '',
                  Consumo: ''
              }));
              
                
             
                  // Logging the extracted MDA data
                  console.log("Extracted MDA Data:", extractedDataMDA);
    
                  const extractedDataMTR = jsonData.MTR[0].Valores.map(item => item.pml);
      
                  // Logging the extracted MTR data
                  console.log("Extracted MTR Data:", extractedDataMTR);
      
                  extractedDataMDA.forEach((row, idx) => {
                      row.MTR = extractedDataMTR[idx] || ''; // Assigning the MTR value
                  });
      
                  // Logging the combined data
                  console.log("Combined Data:", extractedDataMDA);
      
                  setData(extractedDataMDA);
              } catch (error) {
                  console.error("Error fetching data:", error);
              }
        }
    };
    

    const handleCSVUpload = (event) => {
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
      
        fetch('http://localhost:5000/api/process_csv', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(uploadedData => {
            console.log('First few entries of Current Data:', data.slice(0, 5));
            console.log('First few entries of Uploaded Data:', uploadedData.slice(0, 5));
      
            const filteredUploadedData = uploadedData.filter(ud => {
              const dateParts = ud.fecha.trim().split('/');
              // Assuming the format is MM/DD/YYYY, if not, adjust the indexing below
              const dateObject = moment(`${dateParts[2]}-${dateParts[0]}-${dateParts[1]}`, 'YYYY-MM-DD');
      
              return dateObject.isSameOrAfter(startDate, 'day') && dateObject.isSameOrBefore(endDate, 'day');
          });
          
      
            // Create a new array based on the current data to avoid mutating state directly
            let newData = [...data];
      
            filteredUploadedData.forEach(ud => {
                // Convert the date from MM/DD/YYYY to YYYY-MM-DD
                const splitDate = ud.fecha.trim().split('/');
                const formattedDate = `${splitDate[2]}-${splitDate[0]}-${splitDate[1]}`;
      
                const index = newData.findIndex(item => formattedDate === item.fecha && (ud.hora + 1) === parseInt(item.hora));
      
                if (index !== -1) {
                    // Update existing entry
                    newData[index].Consumo = ud.Consumo;
      
                    // Calculate MWhHora and MWhExcedente based on Consumo and KWcontratado
                    const threshold = parseFloat(KWcontratadoValue) / 1000;
                    newData[index].MWhHora = ud.Consumo > threshold ? threshold : ud.Consumo;
                    newData[index].MWhExcedente = ud.Consumo > threshold ? ud.Consumo - threshold : 0;
      
                    // Calculate FacturacionEstimada
                    newData[index].FacturacionEstimada = (parseFloat(newData[index].MDA) + Math.abs(parseFloat(newData[index].MDA) * 0.201)) * newData[index].MWhHora;
                    
                    // Calculate FacturacionEstimadaExcedente
                    newData[index].FacturacionEstimadaExcedente = parseFloat(newData[index].MWhExcedente) * (parseFloat(newData[index].MTR) + Math.abs(parseFloat(newData[index].MTR) * 0.201));
      
                } else {
                    // Add new entry
                    const threshold = parseFloat(KWcontratadoValue) / 1000;
                    const MWhHoraValue = ud.Consumo > threshold ? threshold : ud.Consumo;
                    const MWhExcedenteValue = ud.Consumo > threshold ? ud.Consumo - threshold : 0;
                    const FacturacionEstimadaValue = (parseFloat(ud.MDA) + Math.abs(parseFloat(ud.MDA) * 0.201)) * MWhHoraValue;
      
                    newData.push({
                        fecha: formattedDate,
                        hora: (ud.hora + 1).toString(),
                        MDA: '',
                        MTR: ud.MTR,
                        KWcontratado: KWcontratadoValue,
                        MWhHora: MWhHoraValue,
                        MWhExcedente: MWhExcedenteValue,
                        FacturacionEstimada: FacturacionEstimadaValue,
                        FacturacionEstimadaExcedente: MWhExcedenteValue * (parseFloat(ud.MTR) + Math.abs(parseFloat(ud.MTR) * 0.201)),
                        Consumo: ud.Consumo
                    });
                }
            });
      
            console.log('New Data:', newData);
            setData(newData);
        })
        .catch(error => {
            console.error('Error processing CSV:', error);
        });
      };
      

      const updateSummary = (data) => {
        const totalMWhHora = data.reduce((acc, curr) => acc + parseFloat(curr.MWhHora || 0), 0);
        const totalMWhExcedente = data.reduce((acc, curr) => acc + parseFloat(curr.MWhExcedente || 0), 0);
        const totalFacturacionEstimada = data.reduce((acc, curr) => acc + parseFloat(curr.FacturacionEstimada || 0), 0);
        const totalFacturacionEstimadaExcedente = data.reduce((acc, curr) => acc + parseFloat(curr.FacturacionEstimadaExcedente || 0), 0);
    
        setSummary({
            totalMWhHora,
            totalMWhExcedente,
            totalFacturacionEstimada,
            totalFacturacionEstimadaExcedente
        });
    };
    
    const handleCellChange = (changes, source) => {
        // If the change is not due to an edit, skip the processing
        if (source !== 'edit') return;
      
        // Create a copy of the data to modify
        let updatedData = [...data];
      
        changes.forEach(([row, prop, oldValue, newValue]) => {
            if (prop === 'Consumo') {
                // Convert the newValue to a number
                let newConsumo = parseFloat(newValue);
      
                // Recalculate dependent columns
                const threshold = parseFloat(KWcontratadoValue) / 1000;
                updatedData[row].MWhHora = newConsumo > threshold ? threshold : newConsumo;
                updatedData[row].MWhExcedente = newConsumo > threshold ? newConsumo - threshold : 0;
                updatedData[row].FacturacionEstimada = (parseFloat(updatedData[row].MDA) + Math.abs(parseFloat(updatedData[row].MDA) * 0.201)) * updatedData[row].MWhHora;
      
                // Recalculate FacturacionEstimadaExcedente
                updatedData[row].FacturacionEstimadaExcedente = updatedData[row].MWhExcedente * (parseFloat(updatedData[row].MTR) + Math.abs(parseFloat(updatedData[row].MTR) * 0.201));
            }
        });
      
        // Update the data state with the modified data
        setData(updatedData);
      };

    useEffect(() => {
        updateSummary(data);
    }, [data]);

    const exportToCSV = () => {
        // Convert main table data to CSV format
        const csvMain = Papa.unparse(data);
      
        // Generate the proper spacing for summary headers
        const emptyColumns = new Array((data[0] && Object.keys(data[0]).length) + 3).fill(""); // Adding 3 more empty columns to push the summary to the right
        const summaryHeaders = [...emptyColumns, "Summary", "Total"];
      
        const summaryData = [
            summaryHeaders,
            [...emptyColumns, "MWh hora", summary.totalMWhHora.toFixed(5)],
            [...emptyColumns, "MWh excedente", summary.totalMWhExcedente.toFixed(5)],
            [...emptyColumns, "Facturación estimada", summary.totalFacturacionEstimada.toFixed(5)],
            [...emptyColumns, "Facturación estimada excedente", summary.totalFacturacionEstimadaExcedente.toFixed(5)]
        ];
      
        // Convert summary data to CSV format
        const csvSummary = Papa.unparse(summaryData);
      
        // Combine the CSV strings with the summary at the top
        const combinedCSV = csvSummary + '\n\n\n' + csvMain;
      
        const blob = new Blob([combinedCSV], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'export.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      const backgroundStyle = {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        height: '100vh',
        width: '100vw'
      };
      return (
        <>
          {/* <div style={backgroundStyle}></div> */}
            <div className="centered-horizontal">
                <h1>Consumos</h1>
            </div>
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            <DateRangePicker
                startDate={startDate} 
                startDateId="your_unique_start_date_id" 
                endDate={endDate} 
                endDateId="your_unique_end_date_id" 
                onDatesChange={({ startDate, endDate }) => {
                    setStartDate(startDate);
                    setEndDate(endDate);
                }} 
                focusedInput={focusedInput} 
                onFocusChange={focusedInput => setFocusedInput(focusedInput)} 
                showClearDates={true}
                isOutsideRange={() => false} 
            />
    
            <label>
                KW(contratado):
                <select value={KWcontratadoValue} onChange={e => setKWcontratadoValue(e.target.value)}>
                    <option value="" disabled hidden>Select a client</option>
                    <option value="1200">biotix = 1200</option>
                    <option value="1500">UTT = 1500</option>
                    <option value="2500">Varian = 2500</option>
                </select>
            </label>
            <button onClick={fetchData}>Obtener datos</button>
            <label>
                Upload CSV:
                <input type="file" accept=".csv" onChange={handleCSVUpload} />
            </label>
            <button onClick={exportToCSV}>Exportar a CSV</button>
    
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <div style={{ flex: 1 }}>
                    <HotTable
                        data={data}
                        colHeaders={['Fecha', 'Hora', 'MDA', 'MTR', 'KW(contratado)', 'MWh hora', 'MWh excedente', 'Facturación estimada', 'Facturación estimada excedente', 'Consumo']}
                        columns={[
                            { data: 'fecha' },
                            { data: 'hora' },
                            { data: 'MDA' },
                            { data: 'MTR' },
                            { data: 'KWcontratado' },
                            { data: 'MWhHora' },
                            { data: 'MWhExcedente' },
                            { data: 'FacturacionEstimada' },
                            { data: 'FacturacionEstimadaExcedente' },
                            { data: 'Consumo' }
                        ]}
                        colWidths={[100, 60, 80, 80, 140, 100, 140, 190, 240, 100]}
                        width="100%"
                        height={650}
                        licenseKey="non-commercial-and-evaluation"
                        afterChange={handleCellChange} 
                    />
                </div>
    
                <div style={{ position: 'absolute', top: '10px', right: '15px', border: '1px solid #ccc', borderRadius: '25px', overflow: 'hidden', fontSize: '0.85em' }}>
                    <table style={{ width: '100%', borderSpacing: '0', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f7f7f7', borderBottom: '1px solid #ccc' }}>
                            <th style={{ padding: '5px', borderRight: '1px solid #ccc', width: '150px' }}>Summary</th>
                                <th style={{ padding: '5px', width: '40%' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
    <tr>
        <td style={{ padding: '5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc' }}>MWh hora</td>
        <td style={{ padding: '5px', borderBottom: '1px solid #ccc' }}>{summary.totalMWhHora.toFixed(5)}</td>
    </tr>
    <tr>
        <td style={{ padding: '5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc' }}>MWh excedente</td>
        <td style={{ padding: '5px', borderBottom: '1px solid #ccc' }}>{summary.totalMWhExcedente.toFixed(5)}</td>
    </tr>
    <tr>
        <td style={{ padding: '5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc' }}>Facturación estimada</td>
        <td style={{ padding: '5px', borderBottom: '1px solid #ccc' }}>{summary.totalFacturacionEstimada.toFixed(5)}</td>
    </tr>
    <tr>
        <td style={{ padding: '5px', borderRight: '1px solid #ccc' }}>Facturación estimada excedente</td>
        <td style={{ padding: '5px' }}>{summary.totalFacturacionEstimadaExcedente.toFixed(5)}</td>
    </tr>
</tbody>

                    </table>
                </div>
            </div>
        </>
    );
    
};

export default Consumos;
