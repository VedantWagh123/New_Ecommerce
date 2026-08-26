import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download a simple, minimalist, and professional PDF Invoice
 * @param {Object} order - Complete order object
 */
export const generateInvoicePDF = (order) => {
    if (!order) return;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Clean colors
    const textDark = [30, 30, 30];
    const textGray = [100, 100, 100];
    const borderGray = [220, 220, 220];

    // --- 1. HEADER SECTION ---
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('VELOURA', 14, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textGray);
    doc.text('Luxury Fashion & Couture', 14, 32);

    // Invoice Meta (Right side)
    const invoiceNo = `INV-${(order._id || Date.now().toString()).slice(-8).toUpperCase()}`;
    const orderDate = order.date ? new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');
    const paymentMethod = order.paymentMethod || (order.payment ? 'Online Payment' : 'Cash on Delivery');

    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('INVOICE', 196, 25, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textGray);
    doc.text(`Invoice No: ${invoiceNo}`, 196, 32, { align: 'right' });
    doc.text(`Date: ${orderDate}`, 196, 37, { align: 'right' });

    // Divider
    doc.setDrawColor(...borderGray);
    doc.line(14, 45, 196, 45);

    // --- 2. ADDRESSES ---
    let y = 55;

    // Billed To (Left)
    const address = order.address || {};
    const customerName = `${address.firstName || 'Valued'} ${address.lastName || 'Customer'}`.trim();
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...textDark);
    doc.text('Billed To:', 14, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textGray);
    doc.text(customerName, 14, y + 6);
    doc.text(`${address.street || ''}`, 14, y + 11);
    doc.text(`${address.city || ''}, ${address.state || ''} - ${address.zipcode || ''}`, 14, y + 16);
    doc.text(`Phone: ${address.phone || 'N/A'}`, 14, y + 21);

    // Sold By (Right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...textDark);
    doc.text('Sold By:', 120, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textGray);
    doc.text('Veloura Fashion Pvt. Ltd.', 120, y + 6);
    doc.text('Level 12, Fashion Towers, BKC', 120, y + 11);
    doc.text('Mumbai, MH - 400051', 120, y + 16);
    doc.text('GSTIN: 27AABCV1234F1Z9', 120, y + 21);

    // --- 3. ITEMS TABLE ---
    y += 35;

    const items = order.items || [];
    const tableRows = items.map((item, index) => {
        const itemPrice = item.price || 0;
        const qty = item.quantity || item.qty || 1;
        const totalLineAmount = itemPrice * qty;
        
        return [
            (index + 1).toString(),
            `${item.name || 'Fashion Apparel'}\nSize: ${item.size || 'N/A'}`,
            qty.toString(),
            `INR ${itemPrice.toLocaleString('en-IN')}`,
            `INR ${totalLineAmount.toLocaleString('en-IN')}`
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total']],
        body: tableRows,
        theme: 'plain',
        headStyles: {
            fillColor: [245, 245, 245],
            textColor: textDark,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'left',
            lineWidth: 0.1,
            lineColor: borderGray
        },
        bodyStyles: {
            fontSize: 9,
            textColor: textDark,
            lineWidth: 0.1,
            lineColor: borderGray
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 90 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 32, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
    });

    // --- 4. SUMMARY SECTION ---
    const finalY = doc.lastAutoTable.finalY + 15;
    const totalAmount = order.amount || items.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0);
    
    const taxable = Math.round(totalAmount / 1.18);
    const gst = totalAmount - taxable;

    // Payment Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.text('Payment Information', 14, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textGray);
    doc.text(`Method: ${paymentMethod}`, 14, finalY + 6);
    doc.text(`Status: ${order.payment ? 'Paid Online' : 'Pending (COD)'}`, 14, finalY + 11);

    // Totals Math
    let sumY = finalY;

    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 140, sumY);
    doc.text(`INR ${taxable.toLocaleString('en-IN')}`, 196, sumY, { align: 'right' });
    sumY += 7;

    doc.text('GST (18%):', 140, sumY);
    doc.text(`INR ${gst.toLocaleString('en-IN')}`, 196, sumY, { align: 'right' });
    sumY += 7;

    doc.text('Shipping:', 140, sumY);
    doc.text('FREE', 196, sumY, { align: 'right' });
    sumY += 7;

    doc.setDrawColor(...borderGray);
    doc.line(140, sumY - 3, 196, sumY - 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...textDark);
    doc.text('Grand Total:', 140, sumY + 3);
    doc.text(`INR ${totalAmount.toLocaleString('en-IN')}`, 196, sumY + 3, { align: 'right' });

    // --- 5. FOOTER ---
    const footerY = 275;
    doc.setDrawColor(...borderGray);
    doc.line(14, footerY, 196, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textGray);
    doc.text('Thank you for your business!', 105, footerY + 7, { align: 'center' });
    doc.text('Returns are accepted within 7 days. Need help? Contact care@velourafashion.com', 105, footerY + 12, { align: 'center' });

    // Save PDF
    doc.save(`Invoice_${invoiceNo}.pdf`);
};
