const express = require('express');
const pdf = require('html-pdf');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Read the HTML template
const templatePath = path.join(process.cwd(), 'templates', 'document.hbs');
const template = fs.readFileSync(templatePath, 'utf8');

// Compile the template
const compiledTemplate = handlebars.compile(template);

// PDF configuration
const pdfOptions = {
  format: 'A4',
  orientation: 'portrait',
  border: {
    top: '20px',
    right: '20px',
    bottom: '20px',
    left: '20px'
  },
  timeout: 30000,
  renderDelay: 1000,
  type: 'pdf',
  quality: '100'
};

app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { name, details } = req.body;

    if (!name || !details) {
      return res.status(400).json({ error: 'Name and details are required' });
    }

    // Prepare template data
    const templateData = {
      name,
      details,
      generatedDate: new Date().toLocaleDateString()
    };

    // Generate HTML from template
    const html = compiledTemplate(templateData);

    // Generate PDF from HTML
    pdf.create(html, pdfOptions).toBuffer((err, buffer) => {
      if (err) {
        console.error('Error generating PDF:', err);
        return res.status(500).json({ error: 'Error generating PDF', details: err.message });
      }

      try {
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
        res.setHeader('Content-Length', buffer.length);
        
        // Send the PDF buffer
        res.end(buffer);
      } catch (sendError) {
        console.error('Error sending PDF:', sendError);
        res.status(500).json({ error: 'Error sending PDF', details: sendError.message });
      }
    });

  } catch (error) {
    console.error('Error in PDF generation route:', error);
    res.status(500).json({ error: 'Error in PDF generation route', details: error.message });
  }
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

module.exports = app;