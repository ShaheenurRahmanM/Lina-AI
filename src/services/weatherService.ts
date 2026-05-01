// Weather service using Open-Meteo API (free, no API key needed)
export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  units: string;
  lastUpdated: string;
}

export async function getWeather(
  location: string,
  units: 'celsius' | 'fahrenheit' = 'celsius'
): Promise<WeatherData> {
  try {
    // First, geocode the location
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!geoResponse.ok) throw new Error('Location not found');

    const geoData = await geoResponse.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`Location "${location}" not found. Please try a different location.`);
    }

    const { latitude, longitude, name, admin1, country } = geoData.results[0];
    const displayName = `${name}${admin1 ? ', ' + admin1 : ''}, ${country}`;

    // Then, get weather for that location
    const temperatureUnit = units === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,apparent_temperature,wind_speed_10m&temperature_unit=${temperatureUnit}&timezone=auto`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!weatherResponse.ok) throw new Error('Unable to fetch weather data');

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;

    // Convert WMO weather codes to descriptions
    const weatherDescriptions: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Foggy',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    };

    return {
      location: displayName,
      temperature: current.temperature_2m,
      condition: weatherDescriptions[current.weather_code] || 'Unknown',
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      feelsLike: current.apparent_temperature,
      units: units === 'fahrenheit' ? '°F' : '°C',
      lastUpdated: new Date().toLocaleTimeString(),
    };
  } catch (error) {
    throw new Error(`Weather service error: ${(error as Error).message}`);
  }
}
