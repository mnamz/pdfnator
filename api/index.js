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
    const doc = new PDFDocument();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add content to the PDF
    doc.fontSize(25)
       .text('Generated Document', { align: 'center' })
       .moveDown();

    doc.fontSize(16)
       .text(`Name: ${name}`, { align: 'left' })
       .moveDown();

    doc.fontSize(14)
       .text(`Details: ${details}`, { align: 'left' })
       .moveDown();

    // Add current date
    doc.fontSize(12)
       .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'left' });

    // Finalize the PDF and end the stream
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error generating PDF' });
  }
});

module.exports = app;