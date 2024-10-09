import requests
import pandas as pd
import re

url = "https://data.ny.gov/resource/wujg-7c2s.json?$query=SELECT%0A%20%20%60transit_timestamp%60%2C%0A%20%20%60station_complex%60%2C%0A%20%20%60ridership%60%2C%0A%20%20%60latitude%60%2C%0A%20%20%60longitude%60%2C%0A%20%20%60georeference%60%0AWHERE%0A%20%20(%60transit_timestamp%60%0A%20%20%20%20%20BETWEEN%20%222024-07-04T00%3A00%3A00%22%20%3A%3A%20floating_timestamp%0A%20%20%20%20%20AND%20%222024-07-04T23%3A45%3A00%22%20%3A%3A%20floating_timestamp)%0A%20%20AND%20caseless_ne(%60transit_mode%60%2C%20%22tram%22)"

def main():
    response = requests.get(url)
    file_path = "julyRidershipData.json"
    
    if response.status_code == 200:
        json_data = response.json()
        data = pd.DataFrame(json_data)
        data = add_line(data)

        json_str_list = data.to_json(orient='records', lines=True).splitlines()
        formatted_data = '[{}]'.format(','.join(json_str_list))
        
        with open(file_path, 'w') as file:
            file.write(formatted_data)
        print('success!')
    else:
        print(f"Failed to retrieve data: {response.status_code}")
        
def add_line(data):
    pattern = r'\(([^)]+)\)'
    data['station_lines'] = data['station_complex'].apply(lambda x: re.search(pattern, x).group(1).split(',') if re.search(pattern, x) else [])
    
    return data
    
    
if __name__ == "__main__":
    main()