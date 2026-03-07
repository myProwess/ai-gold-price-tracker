# Indian Gold Price Tracker 🪙🥇

> A modern, real-time tracking dashboard for live gold and silver commodity prices with interactive historical charting.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Language](https://img.shields.io/badge/Python-3.14-yellow.svg)
![Framework](https://img.shields.io/badge/Flask-3.0.x-black.svg)

---

## 🌟 Features

- **Real-time Tracking**: Live dashboard interfaces for both 24K Gold and 1 Kg Silver market prices.
- **Historical Charts**: Interactive, rich line charts utilizing `Chart.js` for 10-day historical trend analysis.
- **On-Demand Data Sync**: Integrated background Python Web-Scraping (`BeautifulSoup4`) that seamlessly pulls fresh data and refreshes the UI without a server restart.
- **Responsive UI**: A fully responsive, modern glassmorphism design powered by Tailwind CSS.
- **Lightweight Storage**: Zero-configuration JSON file database architecture designed for rapid, low-footprint local deployments.

---

## 🏗️ Technical Architecture

The application focuses on a lightweight, server-driven architecture to maintain data locality and rapid response times.

**Tech Stack**:
- **Backend/API**: Python 3 / Flask
- **Data Engine**: Python `urllib` & `BeautifulSoup4` (Web Scraping)
- **Database**: Local `JSON` datastore (`rates_data.json`)
- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (via CDN)
- **Visualizations**: Chart.js

**Data Flow**:
1. User clicks **"Update Data"** in the UI.
2. Frontend `app.js` issues an asynchronous `POST` to the Flask `api/sync-data` endpoint.
3. Flask executes the internal `scraper.py` engine via native subprocesses.
4. The scraper parses public market data (Goodreturns) and overwrites the active `rates_data.json` database.
5. The UI automatically reloads, refetching the updated JSON file and redrawing the Chart.js canvas instances.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your host machine:

- **Python 3.8+**
- **pip** (Python package installer)

*(No external API keys are required; the application relies on an internal scraping engine)*

---

## 🚀 Installation & Setup

Follow these steps to get a local development environment running:

**1. Clone the repository**
```bash
git clone https://github.com/your-username/Precious-Metal-Tracker.git
cd Precious-Metal-Tracker
```

**2. Virtual Environment (Optional but Recommended)**
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

**3. Install Dependencies**
```bash
pip install -r requirements.txt
```

**4. Start the Application**
```bash
python app.py
```

The server will initialize. Open your web browser and navigate to:
`http://127.0.0.1:5000`

---

## 🔌 API Integration Details

While the application primarily drives a frontend UI, the Flask backend exposes endpoints for integration:

### Trigger Data Sync
Force the internal data engine to scrape new market data and update the database.

- **URL**: `/api/sync-data`
- **Method**: `POST`
- **Response Structure**:
```json
{
  "status": "success",
  "message": "Data synced successfully."
}
```

### Fetch Raw Database
Query the raw JSON market state.

- **URL**: `/rates_data.json`
- **Method**: `GET`

---

## 🗄️ Database Schema

Data is stored locally in `rates_data.json`. The schema separates metadata from the literal historical and current price arrays.

```json
{
  "meta": {
    "location": "Trichy",
    "last_updated": "2026-03-07T20:28:02Z",
    "source": "goodreturns.in"
  },
  "datasource": {
    "gold_rates": [ ... 1-day summary arrays ],
    "silver_rates": [ ... 1-day summary arrays ],
    "gold_history": [
      {
         "date": "Mar 07, 2026",
         "price_24k": 16418,
         "price_22k": 15050
      }
    ],
    "silver_history": [ ... ]
  }
}
```

---

## 👨‍💻 Usage Instructions

1. Launch the Flask application.
2. Navigate between the **Gold** and **Silver** tabs using the top navigation bar.
3. Observe the "Today's Rate Summary" cards for an immediate overview.
4. Interact with the **Chart.js graphs** by hovering over historical nodes to view specific daily prices.
5. Click the **"Update Data"** button in the header if the `last_updated` timestamp is older than the current day to forcefully execute a real-time web scrape sync.

---

## 🤝 Contribution Guidelines

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

Please ensure Python scripts adhere to **PEP 8** standards before submitting PRs.

---

## 📄 License

Distributed under the MIT License. See `LICENSE.txt` for more information.
