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
    
    console.log('Parsed fields:', fields);
    console.log('Parsed files:', Object.keys(files));
    
    const formData = new FormData();
    
    // Add fields
    Object.entries(fields).forEach(([key, value]) => {
      const fieldValue = Array.isArray(value) ? value[0] : value;
      formData.append(key, fieldValue);
      console.log(`Added field: ${key} = ${fieldValue}`);
    });
    
    // Add files
    Object.entries(files).forEach(([key, fileArray]) => {
      const fileList = Array.isArray(fileArray) ? fileArray : [fileArray];
      fileList.forEach(file => {
        if (file && file.filepath) {
          formData.append('files', fs.createReadStream(file.filepath), file.originalFilename || file.newFilename);
          console.log(`Added file: ${file.originalFilename || file.newFilename}`);
        }
      });
    });

    console.log('Sending request to asset API...');
    const response = await fetch('http://157.245.20.199:8000/api/v1/process-images', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('Asset API response:', response.status, data);
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}