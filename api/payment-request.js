const express = require('express');
const PDFDocument = require('pdfkit');
const axios = require('axios');

const app = express();

// Base64 encoded logo - replace this with your actual logo
const logoBase64 = `data:image/jpeg;base64,/9j/4Qd9RXhpZgAATU0AKgAAAAgADAEAAAMAAAABDQUAAAEBAAMAAAABA0EAAAECAAMAAAADAAAAngEGAAMAAAABAAIAAAESAAMAAAABAAEAAAEVAAMAAAABAAMAAAEaAAUAAAABAAAApAEbAAUAAAABAAAArAEoAAMAAAABAAIAAAExAAIAAAAhAAAAtAEyAAIAAAAUAAAA1YdpAAQAAAABAAAA7AAAASQACAAIAAgALcbAAAAnEAAtxsAAACcQQWRvYmUgUGhvdG9zaG9wIDI1LjEgKE1hY2ludG9zaCkAMjAyNDowNjoyMCAwNzo1MTozOAAAAAAABJAAAAcAAAAEMDIzMaABAAMAAAAB//8AAKACAAQAAAABAAALoKADAAQAAAABAAAB0AAAAAAAAAAGAQMAAwAAAAEABgAAARoABQAAAAEAAAFyARsABQAAAAEAAAF6ASgAAwAAAAEAAgAAAgEABAAAAAEAAAGCAgIABAAAAAEAAAXzAAAAAAAAAEgAAAABAAAASAAAAAH/2P/tAAxBZG9iZV9DTQAC/+4ADkFkb2JlAGSAAAAAAf/bAIQADAgICAkIDAkJDBELCgsRFQ8MDA8VGBMTFRMTGBEMDAwMDAwRDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAENCwsNDg0QDg4QFA4ODhQUDg4ODhQRDAwMDAwREQwMDAwMDBEMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM/8AAEQgAGQCgAwEiAAIRAQMRAf/dAAQACv/EAT8AAAEFAQEBAQEBAAAAAAAAAAMAAQIEBQYHCAkKCwEAAQUBAQEBAQEAAAAAAAAAAQACAwQFBgcICQoLEAABBAEDAgQCBQcGCAUDDDMBAAIRAwQhEjEFQVFhEyJxgTIGFJGhsUIjJBVSwWIzNHKC0UMHJZJT8OHxY3M1FqKyg [... omitted end of long line]`;

// Function to clean up mailto formatting in description text
function extractEmailFromDescription(text) {
  if (!text) return '';
  
  // Remove (mailto:email) parts but keep the email address
  // Pattern matches: [email](mailto:email) and replaces with just the email
  return text.replace(/\[([^\]]+)\]\(mailto:[^)]+\)/g, '$1');
}

app.get('/api/payment-request/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch data from Kissflow
    const kissflowResponse = await axios.get(
      `https://alice-smith.kissflow.com/process/2/AcflcLIlo4aq/admin/Payment_Request/${id}`,
      {
        headers: {
          'X-Access-Key-Id': process.env.KISSFLOW_ACCESS_KEY_ID,
          'X-Access-Key-Secret': process.env.KISSFLOW_ACCESS_KEY_SECRET
        }
      }
    );
    
    const kissflowData = kissflowResponse.data;

    // Map Kissflow response fields to template variables
    const finalData = {
      payFormNumber: kissflowData.PAY_Form_Number || 'PAY-DEFAULT-001',
      requestedByFullName: kissflowData.Untitle_Field_4 || kissflowData.Requested_By_Full_Name || 'Default User',
      requesterEmployeeId: kissflowData.Requested_By_Employee_Number || 'DEFAULT-001',
      requestedByEmail: kissflowData.Requested_By_Email || 'default@alice-smith.edu.my',
      requestedByDepartment: kissflowData.Requested_By_Department || 'Default Department',
      payTo: kissflowData.Pay_To || 'Default Payee',
      paymentMethod: kissflowData.Payment_Method || 'Default Method',
      budgetCode: kissflowData.Budget_Code_1_ID || 'DEFAULT-BUDGET',
      paymentDate: kissflowData.Payment_Date ? new Date(kissflowData.Payment_Date).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),
      paymentDetails: kissflowData['Table::Payment_Request_Details_Budget_Code_1'] && Array.isArray(kissflowData['Table::Payment_Request_Details_Budget_Code_1']) ? kissflowData['Table::Payment_Request_Details_Budget_Code_1'].map(item => ({
        date: item.Transaction_Date_Input ? new Date(item.Transaction_Date_Input).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),
        reference: item.Document_Reference_1 || 'Default Reference',
        description: extractEmailFromDescription(item.Description || 'Default Description'),
        amount: item.Amount_MYR || '0.00'
      })) : [
        {
          date: new Date().toLocaleDateString('en-CA'),
          reference: 'Default Reference',
          description: 'Default Description',
          amount: '0.00'
        }
      ],
      totalSpent: kissflowData.Table_1_Spent_MYR || '0.00 MYR'
    };

    // Generate filename based on Payment Request number
    const filename = `${finalData.payFormNumber}.pdf`;

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe the PDF to response
    doc.pipe(res);

    // Calculate page dimensions
    const pageWidth = doc.page.width - 100; // Full width minus margins

    // Add logo
    if (logoBase64) {
      const logoHeight = 80; // Increased height for better visibility
      const logoX = 50; // Start from left margin
      
      doc.image(logoBase64, logoX, 50, {
        width: pageWidth,
        height: logoHeight
      });
    }

    // Add title
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('Payment Request', 50, 150, { align: 'center' });

    // Add form number
    doc.fontSize(12)
       .font('Helvetica')
       .text(finalData.payFormNumber, 50, 180, { align: 'center' });

    // Add requester and payment details table
    const tableTop = 220;
    const colWidths = [200, 250];
    let currentX = 50;

    // Draw table header with borders
    doc.rect(50, tableTop, 450, 80).stroke();
    doc.rect(50, tableTop, 450, 80).fill('#f0f0f0');

    // Add table data
    let currentRowY = tableTop + 10;
    
    // Row 1
    doc.fontSize(10).font('Helvetica-Bold').text('Requested By Full Name:', 55, currentRowY);
    doc.font('Helvetica').text(finalData.requestedByFullName, 255, currentRowY);
    doc.font('Helvetica-Bold').text('Requester Employee ID:', 55, currentRowY + 15);
    doc.font('Helvetica').text(finalData.requesterEmployeeId, 255, currentRowY + 15);
    
    // Row 2
    currentRowY += 30;
    doc.font('Helvetica-Bold').text('Requested By Email:', 55, currentRowY);
    doc.font('Helvetica').text(finalData.requestedByEmail, 255, currentRowY);
    doc.font('Helvetica-Bold').text('Requested By Department:', 55, currentRowY + 15);
    doc.font('Helvetica').text(finalData.requestedByDepartment, 255, currentRowY + 15);
    
    // Row 3
    currentRowY += 30;
    doc.font('Helvetica-Bold').text('Pay To:', 55, currentRowY);
    doc.font('Helvetica').text(finalData.payTo, 255, currentRowY);
    doc.font('Helvetica-Bold').text('Payment Method:', 55, currentRowY + 15);
    doc.font('Helvetica').text(finalData.paymentMethod, 255, currentRowY + 15);
    
    // Row 4
    currentRowY += 30;
    doc.font('Helvetica-Bold').text('Budget Code:', 55, currentRowY);
    doc.font('Helvetica').text(finalData.budgetCode, 255, currentRowY);
    doc.font('Helvetica-Bold').text('Payment Date:', 55, currentRowY + 15);
    doc.font('Helvetica').text(finalData.paymentDate, 255, currentRowY + 15);

    // Draw second table - itemized budget details
    const table2Top = tableTop + 100;
    
    // Draw table header with borders
    doc.rect(50, table2Top, 450, 20).stroke();
    doc.rect(50, table2Top, 450, 20).fill('#e8e8e8');

    // Add header texts
    const headers2 = ['Date', 'Reference', 'Description', 'Amount'];
    const col2Widths = [80, 100, 180, 90];
    currentX = 50;
    
    headers2.forEach((header, i) => {
      doc.font('Helvetica-Bold')
         .fillColor('black')
         .text(header, currentX + 5, table2Top + 5, { width: col2Widths[i] });
      
      // Draw vertical lines
      if (i < headers2.length) {
        doc.moveTo(currentX, table2Top)
           .lineTo(currentX, table2Top + 20 + (finalData.paymentDetails.length * 20))
           .stroke();
      }
      currentX += col2Widths[i];
    });
    // Last vertical line
    doc.moveTo(currentX, table2Top)
       .lineTo(currentX, table2Top + 20 + (finalData.paymentDetails.length * 20))
       .stroke();

    // Draw horizontal line after header
    doc.moveTo(50, table2Top + 20)
       .lineTo(500, table2Top + 20)
       .stroke();

    // Add table data
    finalData.paymentDetails.forEach((item, index) => {
      const rowY = table2Top + 25 + (index * 20);
      doc.font('Helvetica').fontSize(10);
      
      let x = 50;
      doc.text(item.date, x + 5, rowY, { width: col2Widths[0] - 10 });
      x += col2Widths[0];
      
      doc.text(item.reference, x + 5, rowY, { width: col2Widths[1] - 10 });
      x += col2Widths[1];
      
      doc.text(item.description, x + 5, rowY, { width: col2Widths[2] - 10 });
      x += col2Widths[2];
      
      doc.text(item.amount + ' MYR', x + 5, rowY, { width: col2Widths[3] - 10 });
    });

    // Draw bottom border of second table
    doc.moveTo(50, table2Top + 20 + (finalData.paymentDetails.length * 20))
       .lineTo(500, table2Top + 20 + (finalData.paymentDetails.length * 20))
       .stroke();

    // Add total at bottom right
    const totalY = table2Top + 40 + (finalData.paymentDetails.length * 20);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Total:', 350, totalY)
       .text(finalData.totalSpent, 400, totalY);

    // Finalize the PDF and end the stream
    doc.end();

  } catch (error) {
    console.error('Error generating Payment Request PDF:', error);
    res.status(500).json({ 
      error: 'Error generating Payment Request PDF', 
      details: error.message 
    });
  }
});

module.exports = app;
