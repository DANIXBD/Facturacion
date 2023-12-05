import pandas as pd
from flask import Flask, jsonify, request, abort, Response
import requests
from calendar import monthrange
import csv
from datetime import datetime, timedelta
import re
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
            cleaned_row = [item.replace(" ", "").replace('"', '').upper() for item in row]
            if "RECORD" in cleaned_row and "DATE" in cleaned_row and "WH3_DEL" in cleaned_row:
                header_idx = idx
                break

        if header_idx == -1:
            raise ValueError("Header row not found in CSV.")

        time_idx = 2
        date_idx = 1
        wh3_del_idx = 4

        hourly_data = {}
        debug_info = []  # List to store data for debugging

        for row in csv_data[header_idx + 1:]:
            try:
                if not row[time_idx] or not row[date_idx]:
                    continue

                # Normalize time and date by stripping spaces
                time = row[time_idx].strip()
                date = row[date_idx].strip()

                # Split the time and handle potential formatting issues
                time_parts = [part.strip() for part in time.split(":")]
                hour, minute = int(time_parts[0]), int(time_parts[1])

                # Check if the entry is at midnight
                is_midnight = hour == 0 and minute == 0

                # Adjust for the entry at midnight, 00:00
                if is_midnight:
                    date_object = datetime.strptime(date, '%m/%d/%Y') - timedelta(days=1)
                    date = date_object.strftime('%m/%d/%Y')
                    hour = 23
                else:
                    if minute == 0:
                        hour = (hour - 1) % 24

                key = f"{date}-{hour}"
                
                if key not in hourly_data:
                    hourly_data[key] = 0
                
                wh3_del_value = float(row[wh3_del_idx]) if row[wh3_del_idx] else 0
                hourly_data[key] += wh3_del_value

                # Store data for debugging
                debug_info.append({'original_date': row[date_idx], 'original_time': row[time_idx], 'adjusted_date': date, 'adjusted_hour': hour, 'wh3_del_value': wh3_del_value})

            except IndexError:
                print(f"Failed processing row: {row}")
                raise ValueError("Error processing a row, possibly due to unexpected format.")
            except Exception as e:
                print(f"Error {e} occurred at row: {row}")
                raise

        # Debugging: Print the last three entries in debug_info
        print("Debugging Info: Last three sets of data processed:")
        for debug_entry in debug_info[-3:]:
            print(debug_entry)

        resulting_hourly_data = [{"fecha": k.split("-")[0], "hora": int(k.split("-")[1]), "Consumo": v/1000} for k, v in hourly_data.items()]

        return jsonify(resulting_hourly_data)

    except Exception as e:
        app.logger.error(f"Error processing CSV: {e}")
        return abort(400, description=str(e))
    

 

def try_parsing_date(text):
    for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%d-%m-%y'):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            pass
    raise ValueError('no valid date format found')

       # Your Banxico API token
    # token = "5634e9f0d12e881b3c6324eeaeeb68ead08313e355e77beb39a94a8cc24dfe8a"

@app.route('/api/fetch_exchange_rates', methods=['POST'])
def fetch_exchange_rates():
    data = request.json
    dates = data.get('dates', [])
    print("Received dates:", dates)


    if not dates:
        print("Debug: No dates provided in the request")
        abort(400, description="Please provide a 'dates' JSON array in the request body.")

    token = "5634e9f0d12e881b3c6324eeaeeb68ead08313e355e77beb39a94a8cc24dfe8a"
    exchange_rates = []

    # Clean the dates list to contain only valid dates and convert to 'YYYY-MM-DD' format if necessary
    cleaned_dates = []
    for date in dates:
        # Check if date is in 'YYYY-MM-DD' format
        if re.match(r'^\d{4}-\d{2}-\d{2}$', date):
            try:
                datetime.strptime(date, "%Y-%m-%d")  # check if it's a valid date
            except ValueError as e:
                print(f"Debug: Error parsing date {date}: {str(e)}")
                continue
        # Else, check if date is in 'DD-MM-YY' format and convert it
        elif re.match(r'^\d{2}-\d{2}-\d{2}$', date):
            try:
                date_obj = datetime.strptime(date, "%d-%m-%y")
                date = date_obj.strftime("%Y-%m-%d")
            except ValueError as e:
                print(f"Debug: Error parsing date {date}: {str(e)}")
                continue
        # If neither, ignore
        else:
            print(f"Debug: Ignoring non-date string: {date}")
            continue


        cleaned_dates.append(date)

    # Convert the list of cleaned dates to a set to remove duplicates and then back to a list to sort them
    unique_dates = sorted(set(cleaned_dates))

    print(f"Debug: Fetching exchange rates for unique dates: {unique_dates}")

    for date in unique_dates:
        start_date = end_date = date

        url = f"https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF60653/datos/{start_date}/{end_date}"
        headers = {"Bmx-Token": token}
        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            print(f"Debug: Error fetching data for date {date}. Status code: {response.status_code}")
            continue

        raw_data = response.json()
        data = raw_data.get("bmx", {}).get("series", [{}])[0].get("datos", [])

        if data:
            rate_record = data[0]
            exchange_rates.append({
                "date": datetime.strptime(rate_record["fecha"], "%d/%m/%Y").isoformat(),  # Corrected to the format provided by the API
                "rate": float(rate_record["dato"])
            })

            print(f"Debug: Successfully fetched data for date {date}: {rate_record}")

    # Sort the exchange rates by date
    exchange_rates.sort(key=lambda x: x['date'])

    print(f"Debug: Finished fetching exchange rates. Total records: {len(exchange_rates)}")

    return jsonify({"exchangeRates": exchange_rates})

if __name__ == '__main__':
    app.run(debug=True, port=5000)