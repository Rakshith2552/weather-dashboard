import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Eye, Gauge, Search, Star, Settings, X, TrendingUp, MapPin } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ============================================
// REDUX STORE SETUP (Simplified without external Redux)
// ============================================
const initialState = {
  cities: [],
  favorites: JSON.parse(localStorage.getItem('favoriteCities')) || [],
  unit: localStorage.getItem('tempUnit') || 'celsius',
  weatherData: {},
  lastFetch: {}
};

// ============================================
// REAL API SERVICE with OpenWeatherMap
// ============================================
const WeatherAPI = {
  API_KEY: '9f5e2dffab9fa90e3decd89b855c7a55',
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
  
  async getCurrentWeather(city) {
    try {
      const response = await fetch(
        `${this.BASE_URL}/weather?q=${city}&appid=${this.API_KEY}&units=metric`
      );
      const data = await response.json();
      
      if (data.cod !== 200) {
        throw new Error(data.message);
      }
      
      return {
        city: data.name,
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        pressure: data.main.pressure,
        visibility: Math.round(data.visibility / 1000), // Convert to km
        uvIndex: 0, // UV index requires separate API call
        dewPoint: Math.round(data.main.temp - ((100 - data.main.humidity) / 5))
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      return null;
    }
  },
  
  async getForecast(city) {
    try {
      const response = await fetch(
        `${this.BASE_URL}/forecast?q=${city}&appid=${this.API_KEY}&units=metric`
      );
      const data = await response.json();
      
      if (data.cod !== "200") {
        throw new Error(data.message);
      }
      
      // Group by day and get one forecast per day
      const dailyForecasts = [];
      const processedDates = new Set();
      
      data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toLocaleDateString();
        
        if (!processedDates.has(dateStr) && dailyForecasts.length < 7) {
          processedDates.add(dateStr);
          dailyForecasts.push({
            date: dateStr,
            temp: Math.round(item.main.temp),
            condition: item.weather[0].main,
            precipitation: item.pop ? Math.round(item.pop * 100) : 0
          });
        }
      });
      
      return dailyForecasts;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      return [];
    }
  },
  
  async getHourlyForecast(city) {
    try {
      const response = await fetch(
        `${this.BASE_URL}/forecast?q=${city}&appid=${this.API_KEY}&units=metric`
      );
      const data = await response.json();
      
      if (data.cod !== "200") {
        throw new Error(data.message);
      }
      
      // Get next 24 hours (8 data points, every 3 hours)
      const hourly = data.list.slice(0, 8).map(item => {
        const date = new Date(item.dt * 1000);
        return {
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          temp: Math.round(item.main.temp),
          windSpeed: Math.round(item.wind.speed * 3.6) // Convert m/s to km/h
        };
      });
      
      return hourly;
    } catch (error) {
      console.error('Error fetching hourly forecast:', error);
      return [];
    }
  }
};

// ============================================
// MAIN APP COMPONENT
// ============================================
function WeatherDashboard() {
  const [state, setState] = useState(initialState);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Initialize with default cities
  useEffect(() => {
    const defaultCities = ['London', 'New York', 'Tokyo', 'Paris'];
    loadCitiesData(defaultCities);
  }, []);

  // Real-time updates every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllCities();
      setLastUpdate(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, [state.cities]);

  const loadCitiesData = async (cities) => {
    const weatherData = { ...state.weatherData };
    const lastFetch = { ...state.lastFetch };
    
    for (const city of cities) {
      const now = Date.now();
      // Cache check: only fetch if data is older than 60s
      if (!lastFetch[city] || now - lastFetch[city] > 60000) {
        weatherData[city] = await WeatherAPI.getCurrentWeather(city);
        lastFetch[city] = now;
      }
    }
    
    setState(prev => ({
      ...prev,
      cities: [...new Set([...prev.cities, ...cities])],
      weatherData,
      lastFetch
    }));
  };

  const refreshAllCities = async () => {
    const cities = state.cities;
    await loadCitiesData(cities);
  };

  const toggleFavorite = (city) => {
    const newFavorites = state.favorites.includes(city)
      ? state.favorites.filter(c => c !== city)
      : [...state.favorites, city];
    
    localStorage.setItem('favoriteCities', JSON.stringify(newFavorites));
    setState(prev => ({ ...prev, favorites: newFavorites }));
  };

  const toggleUnit = () => {
    const newUnit = state.unit === 'celsius' ? 'fahrenheit' : 'celsius';
    localStorage.setItem('tempUnit', newUnit);
    setState(prev => ({ ...prev, unit: newUnit }));
  };

  const convertTemp = (temp) => {
    if (state.unit === 'fahrenheit') {
      return Math.round((temp * 9/5) + 32);
    }
    return temp;
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await loadCitiesData([searchQuery]);
      setSearchQuery('');
    }
  };

  const getWeatherIcon = (condition) => {
    switch(condition) {
      case 'Clear': return <Sun className="w-12 h-12 text-yellow-400" />;
      case 'Rain': return <CloudRain className="w-12 h-12 text-blue-400" />;
      default: return <Cloud className="w-12 h-12 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Weather Analytics Dashboard</h1>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-600">Last update: {new Date(lastUpdate).toLocaleTimeString()}</span>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <Settings className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Search
          </button>
        </div>

        {/* City Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.cities.map(city => {
            const weather = state.weatherData[city];
            if (!weather) return null;

            return (
              <div
                key={city}
                onClick={() => setSelectedCity(city)}
                className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow relative"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(city);
                  }}
                  className="absolute top-4 right-4"
                >
                  <Star
                    className={`w-6 h-6 ${state.favorites.includes(city) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                </button>

                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <h2 className="text-2xl font-bold text-gray-800">{city}</h2>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-5xl font-bold text-gray-800">
                      {convertTemp(weather.temp)}°{state.unit === 'celsius' ? 'C' : 'F'}
                    </div>
                    <div className="text-gray-600 mt-2">{weather.condition}</div>
                  </div>
                  {getWeatherIcon(weather.condition)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span>{weather.humidity}% Humidity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-gray-400" />
                    <span>{weather.windSpeed} km/h</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed View Modal */}
      {selectedCity && (
        <DetailedView
          city={selectedCity}
          weather={state.weatherData[selectedCity]}
          unit={state.unit}
          convertTemp={convertTemp}
          onClose={() => setSelectedCity(null)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          unit={state.unit}
          onToggleUnit={toggleUnit}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// ============================================
// DETAILED VIEW COMPONENT
// ============================================
function DetailedView({ city, weather, unit, convertTemp, onClose }) {
  const [forecast, setForecast] = useState([]);
  const [hourly, setHourly] = useState([]);

  useEffect(() => {
    loadDetailedData();
  }, [city]);

  const loadDetailedData = async () => {
    const forecastData = await WeatherAPI.getForecast(city);
    const hourlyData = await WeatherAPI.getHourlyForecast(city);
    setForecast(forecastData);
    setHourly(hourlyData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{city} - Detailed Analytics</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Gauge />} label="Pressure" value={`${weather.pressure} hPa`} />
          <StatCard icon={<Eye />} label="Visibility" value={`${weather.visibility} km`} />
          <StatCard icon={<Sun />} label="UV Index" value={weather.uvIndex} />
          <StatCard icon={<Droplets />} label="Dew Point" value={`${weather.dewPoint}°`} />
        </div>

        {/* 7-Day Forecast */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            7-Day Forecast
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {forecast.map((day, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600 mb-2">{day.date.split('/')[1]}/{day.date.split('/')[0]}</div>
                <div className="text-2xl font-bold mb-2">{convertTemp(day.temp)}°</div>
                <div className="text-xs text-gray-500">{day.condition}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Temperature Chart */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">24-Hour Temperature Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={2} name="Temperature (°C)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Wind Speed Chart */}
        <div>
          <h3 className="text-xl font-bold mb-4">Wind Speed Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="windSpeed" fill="#10b981" name="Wind Speed (km/h)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Precipitation Chart */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Precipitation Forecast</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="precipitation" fill="#60a5fa" name="Precipitation (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================
function StatCard({ icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-2 text-gray-600 mb-2">
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
}

function SettingsModal({ unit, onToggleUnit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg">Temperature Unit</span>
            <button
              onClick={onToggleUnit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {unit === 'celsius' ? '°C → °F' : '°F → °C'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherDashboard;