# convert csv file to json file

import csv
import json

# Open the CSV file
with open('data/cities/cities.csv', 'r') as csv_file:
    # Create a dictionary reader
    reader = csv.DictReader(csv_file, delimiter=';')

    # Convert the CSV data into a list of dictionaries
    rows = list(reader)

# Convert the list of dictionaries to a JSON object
json_data = json.dumps(rows)

# Save the JSON object to a file
with open('data/cities/output.json', 'w') as json_file:
    json_file.write(json_data)
