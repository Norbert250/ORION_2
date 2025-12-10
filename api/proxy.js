export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('http://157.245.20.199:8000/api/v1/process-images', {
      method: 'POST',
      body: req.body,
      headers: {
        ...req.headers,
        host: undefined,
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error' });
  }
}