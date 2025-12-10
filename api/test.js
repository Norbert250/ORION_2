export default function handler(req, res) {
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body type:', typeof req.body);
  
  if (req.method === 'POST') {
    res.status(200).json({ 
      message: 'Test endpoint working',
      method: req.method,
      contentType: req.headers['content-type']
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}