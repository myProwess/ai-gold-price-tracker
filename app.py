from flask import Flask, render_template, jsonify, send_from_directory
import subprocess
import os

app = Flask(__name__, template_folder='.')

# Serve JSON data directly from the root directory
@app.route('/rates_data.json')
def serve_rates_data():
    return send_from_directory(os.getcwd(), 'rates_data.json')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/silver.html')
def silver():
    return render_template('silver.html')

@app.route('/api/sync-data', methods=['POST'])
def sync_data():
    try:
        # Execute the scraper.py script
        result = subprocess.run(
            ['python', 'scraper.py'],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            return jsonify({
                "status": "success",
                "message": "Data successfully synchronized."
            }), 200
        else:
             print(f"Scraper Error: {result.stderr}")
             return jsonify({
                 "status": "error",
                 "message": "Scraper script failed."
             }), 500
    except Exception as e:
        print(f"Exception during sync: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Server encountered an error: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
