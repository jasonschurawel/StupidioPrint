const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3001;

// Get local IP address for network access
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const interfaceName of Object.keys(interfaces)) {
    for (const interface of interfaces[interfaceName]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
};

const localIP = getLocalIP();

// Enable CORS for both localhost and network access
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    `http://${localIP}:5173`,
    `http://${localIP}:4173`
  ],
  credentials: true
}));

app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({ storage });

// Print endpoint
app.post('/api/print', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const configScriptPath = path.join(__dirname, '..', 'config_printer.sh');
  
  // Parse print settings from the request
  let settings = {};
  try {
    if (req.body.settings) {
      settings = JSON.parse(req.body.settings);
      console.log('Received print settings:', settings);
    }
  } catch (error) {
    console.warn('Failed to parse print settings:', error);
  }
  
  // Load the actual configured printer from config file
  const configPath = path.join(__dirname, '..', 'public', 'stupidoprint_config.json');
  let configuredPrinter = 'HP-OfficeJet-Pro-9120e-Series'; // fallback
  
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.DEFAULT_PRINTER) {
        configuredPrinter = config.DEFAULT_PRINTER;
      }
    }
  } catch (error) {
    console.warn('Could not load printer config, using fallback:', error);
  }
  
  // Build print command with explicit printer name and settings
  let printCommand = `"${configScriptPath}" print "${filePath}" "${configuredPrinter}"`;
  
  // Add duplex option if specified
  if (settings.duplex === 'zweiseitig-horizontal') {
    printCommand += ' duplex-horizontal';
  } else if (settings.duplex === 'zweiseitig-vertikal') {
    printCommand += ' duplex-vertical';
  }
  
  console.log('Executing print command:', printCommand);
  console.log('Using configured printer:', configuredPrinter);
  
  exec(printCommand, (error, stdout, stderr) => {
    // Clean up uploaded file after printing (optional)
    fs.unlink(filePath, (unlinkError) => {
      if (unlinkError) {
        console.warn('Failed to clean up uploaded file:', unlinkError);
      }
    });

    if (error) {
      console.error('Print command failed:', error);
      console.error('stderr:', stderr);
      console.error('Command was:', printCommand);
      return res.status(500).json({ 
        error: 'Print command failed', 
        details: stderr || error.message,
        command: printCommand
      });
    }

    console.log('Print command output:', stdout);
    res.json({ 
      success: true, 
      message: 'Print job submitted successfully',
      output: stdout,
      command: printCommand,
      settings: settings
    });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Print server is running' });
});

// Get printer configuration
app.get('/api/config', (req, res) => {
  const configPath = path.join(__dirname, '..', 'public', 'stupidoprint_config.json');
  
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      res.json(config);
    } catch (error) {
      console.error('Failed to read config:', error);
      res.status(500).json({ error: 'Failed to read configuration' });
    }
  } else {
    res.status(404).json({ error: 'Configuration not found' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🖨️  Print server running on:');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIP}:${PORT}`);
  console.log('');
  console.log('📡 Allowed CORS origins:');
  console.log('   http://localhost:5173 (dev)');
  console.log('   http://localhost:4173 (preview)');
  console.log(`   http://${localIP}:5173 (network dev)`);
  console.log(`   http://${localIP}:4173 (network preview)`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST /api/print - Submit print jobs');
  console.log('  GET /api/config - Get printer configuration');
  console.log('  GET /api/health - Health check');
});

module.exports = app;
