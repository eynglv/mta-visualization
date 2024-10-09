import requests
import pandas as pd
import re

url = "https://data.ny.gov/resource/3uhz-sej2.json?$query=SELECT%20%60operator%60%2C%20%60service%60%2C%20%60hex_color%60%2C%20%60cmyk%60"

def main():
    response = requests.get(url)
    output_path = '/Users/elvyyang/Desktop/mtaColors/visualization/src/data/mtaColors.json'
    if response.status_code == 200:
        json_data = response.json()
        data = pd.DataFrame(json_data)

        json_str_list = data.to_json(orient='records', lines=True).splitlines()
        formatted_data = '[{}]'.format(','.join(json_str_list))
        
        with open(output_path, 'w') as file:
            file.write(formatted_data)
        print('success!')
    else:
        print(f"Failed to retrieve data: {response.status_code}")
        
        
if __name__ == "__main__":
    main()