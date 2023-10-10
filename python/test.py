from flask import Flask, jsonify, request, abort
import requests
from calendar import monthrange
import csv

app = Flask(__name__)

@app.route('/')
def index():
    return "Welcome to the Flask server!"

@app.route('/api/fetch_external', methods=['GET'])
def fetch_external():
    fecha_ini = request.args.get('start_date')
    fecha_fin = request.args.get('end_date')
    
    splitted_fecha_ini = fecha_ini.split("-")
    splitted_fecha_fin = fecha_fin.split("-")    

    year_ini =  splitted_fecha_ini[0]
    month_ini = splitted_fecha_ini[1]

    year_fin = splitted_fecha_fin[0]
    month_fin = splitted_fecha_fin[1]

    length = monthrange(int(year_ini), int(month_ini))[1]

    temp = 0
    intervals = []
    while(temp < length):
        if temp != 0:
            intervals.append(temp)
        temp += 7 

    if intervals[-1] != length:
        intervals.append(length)
    
    all_data_MDA = []
    all_data_MTR = []
    index = 0
    for interval in intervals:
        if index == 0:
            start_day = 1
        else:
            start_day = intervals[index - 1] + 1
        
        url_MDA = f"https://ws01.cenace.gob.mx:8082/SWPML/SIM/BCA/MDA/07MIS-230/{year_ini}/{month_ini}/{str(start_day).zfill(2)}/{year_fin}/{month_fin}/{str(interval).zfill(2)}/JSON"
        url_MTR = url_MDA.replace("MDA", "MTR")
        
        index += 1
        response_MDA = requests.get(url_MDA)
        response_MTR = requests.get(url_MTR)
        
        if response_MDA.status_code == 200:
            datos_MDA = response_MDA.json()["Resultados"][0]["Valores"]
            filtered_data_MDA = [item for item in datos_MDA if fecha_ini <= item['fecha'] <= fecha_fin]
            all_data_MDA.extend(filtered_data_MDA)
        else:
            print(f"Error fetching from {url_MDA}: {response_MDA.status_code}")

        if response_MTR.status_code == 200:
            datos_MTR = response_MTR.json()["Resultados"][0]["Valores"]
            filtered_data_MTR = [item for item in datos_MTR if fecha_ini <= item['fecha'] <= fecha_fin]
            all_data_MTR.extend(filtered_data_MTR)
        else:
            print(f"Error fetching from {url_MTR}: {response_MTR.status_code}")

    return jsonify({"MDA": [{"Valores": all_data_MDA}], "MTR": [{"Valores": all_data_MTR}]})

@app.route('/api/process_csv', methods=['POST'])
def process_csv():
    try:
        uploaded_file = request.files['file']
        if uploaded_file.filename == "":
            raise ValueError("No file selected")
        
        csv_content = uploaded_file.read().decode('utf-8')
        csv_data = list(csv.reader(csv_content.splitlines()))

        header_idx = -1
        for idx, row in enumerate(csv_data):
            cleaned_row = [item.replace(" ", "").replace('"', '').upper() for item in row]  # Clean and normalize the row
            if "RECORD" in cleaned_row and "DATE" in cleaned_row and "WH3_DEL" in cleaned_row:
                header_idx = idx
                break

        if header_idx == -1:
            raise ValueError("Header row (Record + Date) not found in CSV.")

        time_idx = 2
        date_idx = 1
        wh3_del_idx = 4

        hourly_data = {}
        for row in csv_data[header_idx + 1:]:
            try:
                if not row[time_idx] or not row[date_idx]:  # Check if the "Time" or "Date" columns are empty
                    continue  # Skip the current row if they are

                time = row[time_idx]
                hour = int(time.split(":")[0])
                date = row[date_idx]

                # Adjust logic to include data from the start of the next hour
                if time.split(":")[1] == "00":
                    hour = (hour - 1) % 24

                key = f"{date}-{hour}"
                
                if key not in hourly_data:
                    hourly_data[key] = 0
                
                wh3_del_value = float(row[wh3_del_idx]) if row[wh3_del_idx] else 0
                hourly_data[key] += wh3_del_value

                if date.strip() == '07/01/2023':
                    print(f"Accumulated for {key}: {hourly_data[key]}")

            except IndexError:
                print(f"Failed processing row: {row}")
                raise ValueError("Error processing a row, possibly due to unexpected format.")
            except Exception as e:
                print(f"Error {e} occurred at row: {row}")
                raise

        for hour in range(24):
            key = f"07/01/2023-{hour}"
            if key in hourly_data:
                print(f"Total for {key}: {hourly_data[key]}")

        resulting_hourly_data = [{"fecha": k.split("-")[0], "hora": int(k.split("-")[1]), "Consumo": v/1000} for k, v in hourly_data.items()]

        return jsonify(resulting_hourly_data)

    except Exception as e:
        app.logger.error(f"Error processing CSV: {e}")
        return abort(400, description=str(e))



if __name__ == '__main__':
    app.run(port=5000)
