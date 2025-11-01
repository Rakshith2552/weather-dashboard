# 🌦️ Weather Analytics Dashboard

A React-based weather application that displays current weather, forecasts, and interactive visualizations for multiple cities.

## ✨ Features

- Real-time weather data with auto-refresh (60s intervals)
- 7-day forecast and hourly temperature trends
- Search cities and save favorites
- Interactive charts (temperature, wind speed, precipitation)
- Celsius/Fahrenheit toggle
- Responsive design

## 🛠️ Tech Stack

- React 18.2.0
- Recharts (charts)
- Tailwind CSS
- OpenWeatherMap API
- localStorage (persistence)

## 🚀 Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/weather-dashboard.git
cd weather-dashboard

# Install dependencies
npm install

# Add your API key in src/App.js
# API_KEY: 'YOUR_API_KEY_HERE'

# Start app
npm start
```

## 🔑 Get API Key

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Get your free API key
3. Replace in `src/App.js`

## 📦 Build for Production

```bash
npm run build
```

## 🌐 Deploy

**Vercel:**
```bash
vercel
```

**Netlify:**
```bash
npm run build
netlify deploy --prod
```

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)

---

Built with ❤️ using React