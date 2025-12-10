import formidable from 'formidable';
import FormData from 'form-data';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable();
    const [fields, files] = await form.parse(req);
    
    const formData = new FormData();
    
    // Add fields
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, Array.isArray(value) ? value[0] : value);
    });
    
    // Add files
    Object.entries(files).forEach(([key, fileArray]) => {
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
      if (file) {
        formData.append(key, fs.createReadStream(file.filepath), file.originalFilename);
      }
    });

    const response = await fetch('http://157.245.20.199:8000/api/v1/process-images', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
}