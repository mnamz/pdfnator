const express = require('express');
const PDFDocument = require('pdfkit');

const app = express();
app.use(express.json());

app.post('/api/generate-pdf', (req, res) => {
  try {
    const { 
      poNo,
      eprNo,
      requestedBy,
      date,
      budgetYear,
      to,
      deliveryTo,
      items,
      budgetSpent
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!poNo) missingFields.push('poNo');
    if (!eprNo) missingFields.push('eprNo');
    if (!requestedBy) missingFields.push('requestedBy');
    if (!to || !Array.isArray(to)) missingFields.push('to (array)');
    if (!deliveryTo || !Array.isArray(deliveryTo)) missingFields.push('deliveryTo (array)');
    if (!items || !Array.isArray(items)) missingFields.push('items (array)');
    if (!budgetSpent || !Array.isArray(budgetSpent)) missingFields.push('budgetSpent (array)');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields: missingFields.join(', ')
      });
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
       .text(poNo, 150, 150)
       
       .font('Helvetica-Bold')
       .text('EPR No:', 50, 170)
       .font('Helvetica')
       .text(eprNo, 150, 170)
       
       .font('Helvetica-Bold')
       .text('Requested By:', 50, 190)
       .font('Helvetica')
       .text(requestedBy, 150, 190);

    // Add header information (right side)
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Date (YYYY-MM-DD):', 300, 150)
       .font('Helvetica')
       .text(date || new Date().toLocaleDateString('en-CA'), 400, 150)
       
       .font('Helvetica-Bold')
       .text('Budget Year:', 300, 170)
       .font('Helvetica')
       .text(budgetYear, 400, 170);

    // Add delivery information
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('To:', 50, 220)
       .font('Helvetica')
       .text(to.join('\n'), 150, 220)
       
       .font('Helvetica-Bold')
       .text('Delivery To:', 300, 220)
       .font('Helvetica')
       .text(deliveryTo.join('\n'), 400, 220);

    // Draw first table
    const tableTop = 340;
    const colWidths = [75, 100, 60, 70, 70, 70, 70];
    let currentX = 50;

    // Draw table header with borders
    doc.rect(50, tableTop, 515, 20).stroke();
    doc.rect(50, tableTop, 515, 20).fill('#e8e8e8');
    
    // Add header texts and vertical lines
    const headers = ['Budget Code', 'Description', 'Quantity', 'Unit Price', 'Discount', 'Total', 'Total in MYR'];
    headers.forEach((header, i) => {
      doc.font('Helvetica-Bold')
         .fillColor('black')
         .text(header, currentX + 5, tableTop + 5, { width: colWidths[i] });
      
      // Draw vertical lines
      if (i < headers.length) {
        doc.moveTo(currentX, tableTop)
           .lineTo(currentX, tableTop + 60)
           .stroke();
      }
      currentX += colWidths[i];
    });
    // Last vertical line
    doc.moveTo(currentX, tableTop)
       .lineTo(currentX, tableTop + 60)
       .stroke();

    // Draw horizontal line after header
    doc.moveTo(50, tableTop + 20)
       .lineTo(565, tableTop + 20)
       .stroke();

    // Add table data
    currentX = 50;
    items.forEach((item, index) => {
      const rowY = tableTop + 25;
      doc.font('Helvetica').fontSize(10);
      doc.text(item.budgetCode, currentX + 5, rowY);
      doc.text(item.description, currentX + colWidths[0] + 5, rowY);
      doc.text(item.quantity.toString(), currentX + colWidths[0] + colWidths[1] + 5, rowY);
      doc.text(item.unitPrice.toString(), currentX + colWidths[0] + colWidths[1] + colWidths[2] + 5, rowY);
      doc.text(item.discount.toString(), currentX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, rowY);
      doc.text(item.total + '\nMYR', currentX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 5, rowY);
      doc.text(item.totalMYR + '\nMYR', currentX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + 5, rowY);
    });

    // Draw bottom border of first table
    doc.moveTo(50, tableTop + 60)
       .lineTo(565, tableTop + 60)
       .stroke();

    // Draw second table
    const table2Top = 450;
    const col2Widths = [150, 180, 185];
    currentX = 50;

    // Draw table header with borders
    doc.rect(50, table2Top, 515, 20).stroke();
    doc.rect(50, table2Top, 515, 20).fill('#e8e8e8');

    // Add header texts and vertical lines
    const headers2 = ['Budget Code', 'Total (Original Currency) Spent', 'Total (MYR) Spent'];
    headers2.forEach((header, i) => {
      doc.font('Helvetica-Bold')
         .fillColor('black')
         .text(header, currentX + 5, table2Top + 5, { width: col2Widths[i] });
      
      // Draw vertical lines
      if (i < headers2.length) {
        doc.moveTo(currentX, table2Top)
           .lineTo(currentX, table2Top + 60)
           .stroke();
      }
      currentX += col2Widths[i];
    });
    // Last vertical line
    doc.moveTo(currentX, table2Top)
       .lineTo(currentX, table2Top + 60)
       .stroke();

    // Draw horizontal line after header
    doc.moveTo(50, table2Top + 20)
       .lineTo(565, table2Top + 20)
       .stroke();

    // Add table data
    budgetSpent.forEach((item, index) => {
      const rowY = table2Top + 25 + (index * 20);
      doc.font('Helvetica').fontSize(10);
      doc.text(item.budgetCode, 55, rowY);
      doc.text(item.originalAmount, 200, rowY);
      doc.text(item.myrAmount, 400, rowY);
    });

    // Draw bottom border of second table
    doc.moveTo(50, table2Top + 60)
       .lineTo(565, table2Top + 60)
       .stroke();

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