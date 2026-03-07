import urllib.request
from bs4 import BeautifulSoup
import json
import datetime

def fetch_html(url):
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'}
    )
    with urllib.request.urlopen(req) as response:
        return response.read().decode('utf-8')

def clean_value(val):
    if not val:
        return val
    return val.replace('₹', '').replace('INR', '').replace(',', '').replace('\xa0', '').replace(' ', '').strip()

def clean_price(val):
    if not val:
        return None
    
    # Remove any trailing "(+...)" or "(-...)" changes packed into the same cell
    if '(' in val:
        val = val.split('(')[0]
        
    val = clean_value(val)
    try:
        return float(val) if '.' in val else int(val)
    except:
        return None

def clean_change(val):
    if not val or val.strip() == '-' or val.strip() == '':
        return 0
    val = clean_value(val)
    if val == '=':
        return 0
    try:
        return float(val) if '.' in val else int(val)
    except Exception:
        return None

def extract_rows(table):
    data = []
    for row in table.find_all('tr'):
        cols = [c.get_text(strip=True) for c in row.find_all(['td', 'th'])]
        data.append(cols)
    return data

gold_html = fetch_html('https://www.goodreturns.in/gold-rates/trichy.html')
silver_html = fetch_html('https://www.goodreturns.in/silver-rates/trichy.html')

soup_g = BeautifulSoup(gold_html, 'html.parser')
soup_s = BeautifulSoup(silver_html, 'html.parser')

warnings_list = []
payload = {
    "meta": {
        "location": "Trichy",
        "last_updated": datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        "source": "goodreturns.in"
    },
    "datasource": {
        "gold_rates": [],
        "silver_rates": [],
        "gold_history": [],
        "silver_history": []
    }
}

gold_tables = soup_g.find_all('table')
if len(gold_tables) >= 3:
    purities = ["24K", "22K", "18K"]
    for i in range(3):
        data = extract_rows(gold_tables[i])
        for row in data:
            if len(row) >= 4 and row[0] and row[0][0].isdigit():
                weight = row[0]
                payload["datasource"]["gold_rates"].append({
                    "purity": purities[i],
                    "weight_unit": f"{weight} Gram" if "Gram" not in weight and "Kg" not in weight else weight,
                    "price_today_inr": clean_price(row[1]),
                    "price_yesterday_inr": clean_price(row[2]),
                    "price_change_inr": clean_change(row[3])
                })
else:
    warnings_list.append("Less than 3 gold tables found!")

# Extract Gold 10-Day History (Table 3)
if len(gold_tables) >= 4:
    gold_hist_data = extract_rows(gold_tables[3])
    # Skip header row
    for row in gold_hist_data[1:]:
        if len(row) >= 2 and row[0]:
            # row: ['Date', '24K', '22K'] etc
            payload["datasource"]["gold_history"].append({
                "date": row[0].strip(),
                "price_24k": clean_price(row[1]) if len(row) > 1 else None,
                "price_22k": clean_price(row[2]) if len(row) > 2 else None
            })

silver_tables = soup_s.find_all('table')
if silver_tables:
    data_s = extract_rows(silver_tables[0])
    for row in data_s:
        if len(row) >= 4 and row[0] and row[0][0].isdigit():
            weight = row[0]
            if weight == '1000':
                w_str = '1 Kg'
            else:
                w_str = f"{weight} Gram" if "gram" not in weight.lower() and "kg" not in weight.lower() else weight
                
            payload["datasource"]["silver_rates"].append({
                "metal": "Silver",
                "weight_unit": w_str,
                "price_today_inr": clean_price(row[1]),
                "price_yesterday_inr": clean_price(row[2]),
                "price_change_inr": clean_change(row[3])
            })
else:
    warnings_list.append("No silver tables found!")

# Extract Silver 10-Day History (Table 1)
if len(silver_tables) >= 2:
    silver_hist_data = extract_rows(silver_tables[1])
    # Skip header row
    for row in silver_hist_data[1:]:
        if len(row) >= 4 and row[0]:
            # row: ['Date', '10 gram', '100 gram', '1 Kg']
            payload["datasource"]["silver_history"].append({
                "date": row[0].strip(),
                "price_1kg": clean_price(row[3]) if len(row) > 3 else None
            })

if warnings_list:
    payload["warnings"] = warnings_list

with open('rates_data.json', 'w', encoding='utf-8') as f:
    json.dump(payload, f, indent=2)

print("SUCCESS")
