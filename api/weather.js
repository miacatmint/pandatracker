// Vercel Serverless Function — 天气代理
// 绕过浏览器 CORS 限制，从服务器端请求 Open-Meteo API
export default async function handler(req, res) {
  // Allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const locations = [
    { name: 'Baulkham Hills', lat: -33.7606, lon: 150.9930 },
    { name: 'Castle Hill',    lat: -33.7310, lon: 151.0040 },
    { name: 'Northmead',      lat: -33.8010, lon: 150.9880 },
    { name: 'Parramatta',     lat: -33.8150, lon: 151.0020 },
  ];

  let lastError = null;

  for (const loc of locations) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast`
        + `?latitude=${loc.lat}&longitude=${loc.lon}`
        + `&hourly=temperature_2m,apparent_temperature,precipitation_probability,windspeed_10m,weathercode`
        + `&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min`
        + `,precipitation_sum,windspeed_10m_max,weathercode,sunrise,sunset`
        + `&timezone=Australia%2FSydney&forecast_days=2`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.daily || !data.hourly) throw new Error('Bad data shape');

      // Inject location name into response
      data._locationName = loc.name;

      res.setHeader('Cache-Control', 's-maxage=1800'); // cache 30 min
      return res.status(200).json(data);
    } catch (e) {
      lastError = e;
      console.warn(`Failed for ${loc.name}:`, e.message);
    }
  }

  res.status(502).json({ error: true, message: lastError?.message || 'All locations failed' });
}
