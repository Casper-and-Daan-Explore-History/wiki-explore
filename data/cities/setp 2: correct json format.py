import json

# Load input JSON file
with open('data/cities/output.json', 'r') as f:
    data = json.load(f)

# Transform data into new format
output = []
for item in data:
    city = item['cityLabel']
    q = item['city']
    lon = float(item['Lon'].replace(',', '.'))
    lat = float(item['Lat'].replace(',', '.'))
    cord = [lon, lat]
    new_item = {'q': q, 'name': city, 'cord': cord}
    output.append(new_item)

# Save output as JSON file
with open('data/cities/output2.json', 'w') as f:
    json.dump(output, f)