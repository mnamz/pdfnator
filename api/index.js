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

app.post('/api/generate-pdf', (req, res) => {
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

    // PDF generation options
    const options = {
      format: 'A4',
      orientation: 'portrait',
      border: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    };

    // Generate PDF from HTML
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error('Error generating PDF:', err);
        return res.status(500).json({ error: 'Error generating PDF' });
      }

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
      
      // Send the PDF buffer
      res.send(buffer);
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error generating PDF' });
  }
});

module.exports = app;