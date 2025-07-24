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
    res.setHeader('Content-Disposition', 'attachment; filename="EPR.pdf"');

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('WS: Electronic Procurement Requisition (EPR)', { align: 'center' })
       .moveDown();

    // Add header information (left side)
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('PO No:', 50, 150)
       .font('Helvetica')
       .text('Prefix-000001', 150, 150)
       
       .font('Helvetica-Bold')
       .text('EPR No:', 50, 170)
       .font('Helvetica')
       .text('Prefix-0001', 150, 170)
       
       .font('Helvetica-Bold')
       .text('Requested By:', 50, 190)
       .font('Helvetica')
       .text('Text data', 150, 190);

    // Add header information (right side)
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Date (YYYY-MM-DD):', 300, 150)
       .font('Helvetica')
       .text(new Date().toLocaleDateString('en-CA'), 400, 150)
       
       .font('Helvetica-Bold')
       .text('Budget Year:', 300, 170)
       .font('Helvetica')
       .text('value2', 400, 170);

    // Add delivery information
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('To:', 50, 220)
       .font('Helvetica')
       .text('Text data\nText data\nText data\nText data, Text data Text data', 150, 220)
       
       .font('Helvetica-Bold')
       .text('Delivery To:', 300, 220)
       .font('Helvetica')
       .text('Attn: Library\nThe Alice Smith School\nText data\nText data\nText data', 400, 220);

    // Add table headers
    const tableTop = 340;
    doc.font('Helvetica-Bold')
       .rect(50, tableTop, 500, 20).fill('#e8e8e8')
       .fillColor('black')
       .text('Budget Code', 55, tableTop + 5)
       .text('Description', 130, tableTop + 5)
       .text('Quantity', 230, tableTop + 5)
       .text('Unit Price', 300, tableTop + 5)
       .text('Discount', 370, tableTop + 5)
       .text('Total', 440, tableTop + 5)
       .text('Total in MYR', 490, tableTop + 5);

    // Add table row
    doc.font('Helvetica')
       .text('Text data', 55, tableTop + 30)
       .text('Text data\nText value', 130, tableTop + 30)
       .text('3,810', 230, tableTop + 30)
       .text('9,597.00', 300, tableTop + 30)
       .text('3,586.00', 370, tableTop + 30)
       .text('4,334.00\nMYR', 440, tableTop + 30)
       .text('3,457.00\nMYR', 490, tableTop + 30);

    // Add second table
    const table2Top = 450;
    doc.font('Helvetica-Bold')
       .rect(50, table2Top, 500, 20).fill('#e8e8e8')
       .fillColor('black')
       .text('Budget Code', 55, table2Top + 5)
       .text('Total (Original Currency) Spent', 200, table2Top + 5)
       .text('Total (MYR) Spent', 400, table2Top + 5);

    // Add second table rows
    doc.font('Helvetica')
       .text('Text data', 55, table2Top + 30)
       .text('4,298 USD', 200, table2Top + 30)
       .text('9,916.00 USD', 400, table2Top + 30)
       
       .text('Text data', 55, table2Top + 50)
       .text('6,391 USD', 200, table2Top + 50)
       .text('2,329.00 USD', 400, table2Top + 50);

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