const express = require('express');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const app = express();
app.use(express.json());

// Read the HTML template
const templatePath = path.join(process.cwd(), 'templates', 'document.hbs');
const template = fs.readFileSync(templatePath, 'utf8');

// Compile the template
const compiledTemplate = handlebars.compile(template);

app.post('/api/generate-pdf', async (req, res) => {
  let browser = null;
  
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

    // Launch browser
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    // Create new page
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      printBackground: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
    res.setHeader('Content-Length', pdf.length);

    // Send the PDF
    res.send(pdf);

  } catch (error) {
    console.error('Error in PDF generation:', error);
    res.status(500).json({ 
      error: 'Error generating PDF', 
      details: error.message 
    });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

module.exports = app;