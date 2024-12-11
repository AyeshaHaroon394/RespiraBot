import pandas as pd
import json

# Read the CSV file
csv_file = 'converted_dataset.csv'  # Replace with your CSV file name
df = pd.read_csv(csv_file, header=None, names=['user', 'assistant'])

# Prepare the formatted data
formatted_data = []

# Create the JSON structure for each conversation
for index, row in df.iterrows():
    conversation = {
        "messages": [
            {"role": "user", "content": row['user']},
            {"role": "assistant", "content": row['assistant']}
        ]
    }
    formatted_data.append(conversation)

# Write the formatted data to a JSONL file
output_file = 'train.jsonl'  # Output file path
with open(output_file, 'w') as f:
    for entry in formatted_data:
        f.write(json.dumps(entry) + '\n')

print(f"Data has been formatted and written to {output_file}")
