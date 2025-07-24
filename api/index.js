const express = require('express');
const PDFDocument = require('pdfkit');

const app = express();
app.use(express.json());

app.post('/api/generate-pdf', (req, res) => {
  try {
    const { name, details } = req.body;

    if (!name || !details) {
      return res.status(400).json({ error: 'Name and details are required' });
    }

    // Create a new PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add styled content to the PDF
    doc.font('Helvetica-Bold')
       .fontSize(25)
       .text('Generated Document', { align: 'center' })
       .moveDown();

    // Add name section
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .text('Name:', { continued: true })
       .font('Helvetica')
       .text(` ${name}`)
       .moveDown();

    // Add details section
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .text('Details:', { continued: true })
       .font('Helvetica')
       .text(` ${details}`)
       .moveDown();

    // Add date
    doc.font('Helvetica')
       .fontSize(10)
       .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'left' });

    // Finalize the PDF and end the stream
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Error generating PDF', 
      details: error.message 
    });
  }
});

module.exports = app;