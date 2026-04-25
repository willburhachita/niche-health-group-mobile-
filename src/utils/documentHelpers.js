import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const CLINIC_NAME = 'Niche Healthcare Limited';
const CLINIC_TAGLINE = 'Professional Healthcare Services';
const CLINIC_PHONE = '+260 97 000 0000';
const CLINIC_EMAIL = 'info@nichehealthcare.co.zm';
const CLINIC_ADDRESS = 'Lusaka, Zambia';
const NAVY = '#3B4B8A';
const PEACH = '#F0A882';

// ── Shared HTML Header (clinic branding) ─────────────────────────────────────
function clinicHeader() {
  return `
    <div class="clinic-header">
      <div class="logo-block">
        <div class="logo-circle">NHL</div>
        <div class="logo-text">
          <div class="clinic-name">${CLINIC_NAME}</div>
          <div class="clinic-tagline">${CLINIC_TAGLINE}</div>
        </div>
      </div>
      <div class="clinic-contact">
        <div>${CLINIC_PHONE}</div>
        <div>${CLINIC_EMAIL}</div>
        <div>${CLINIC_ADDRESS}</div>
      </div>
    </div>
    <div class="header-bar"></div>
  `;
}

// ── Shared base styles ────────────────────────────────────────────────────────
function baseStyles() {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #1A1A2E; font-size: 13px; padding: 32px; background: #fff; }
      .clinic-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .logo-block { display: flex; align-items: center; gap: 14px; }
      .logo-circle {
        width: 56px; height: 56px; border-radius: 50%;
        background: ${NAVY}; color: #fff;
        font-size: 18px; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
        letter-spacing: 1px;
      }
      .clinic-name { font-size: 18px; font-weight: 700; color: ${NAVY}; }
      .clinic-tagline { font-size: 11px; color: #888; margin-top: 2px; }
      .clinic-contact { text-align: right; font-size: 11px; color: #555; line-height: 1.7; }
      .header-bar { height: 4px; background: linear-gradient(to right, ${NAVY}, ${PEACH}); border-radius: 2px; margin-bottom: 24px; }
      h2 { font-size: 20px; color: ${NAVY}; font-weight: 700; }
      h3 { font-size: 15px; color: ${NAVY}; font-weight: 600; }
      .section { margin-bottom: 20px; }
      .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: ${NAVY}; color: #fff; padding: 9px 12px; text-align: left; font-size: 12px; }
      td { padding: 9px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
      tr:nth-child(even) td { background: #f8f9fc; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
      .badge-paid { background: #e8f5e9; color: #2e7d32; }
      .badge-unpaid { background: #fff8e1; color: #f57f17; }
      .badge-overdue { background: #fce4ec; color: #c62828; }
      .total-box { background: #f0f2f8; border-radius: 8px; padding: 16px; margin-top: 16px; }
      .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
      .total-final { font-size: 16px; font-weight: 700; color: ${NAVY}; border-top: 2px solid ${NAVY}; padding-top: 8px; margin-top: 4px; }
      .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #eee; text-align: center; font-size: 10px; color: #aaa; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
      .info-block { background: #f8f9fc; border-radius: 8px; padding: 12px; }
    </style>
  `;
}

// ── Invoice PDF ───────────────────────────────────────────────────────────────
export function buildInvoiceHTML({ invoice, patient, lineItems, payments, appointment, creatorName }) {
  const statusBadge = invoice.status === 'paid'
    ? '<span class="badge badge-paid">PAID</span>'
    : invoice.status === 'overdue'
      ? '<span class="badge badge-overdue">OVERDUE</span>'
      : '<span class="badge badge-unpaid">UNPAID</span>';

  const totalPaid = (payments ?? []).reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, invoice.total - totalPaid);

  const lineRows = (lineItems ?? []).map(item => `
    <tr>
      <td>${item.description}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">K ${item.unitPrice.toLocaleString()}</td>
      <td class="text-right"><strong>K ${item.total.toLocaleString()}</strong></td>
    </tr>
  `).join('');

  const paymentRows = (payments ?? []).length > 0
    ? (payments ?? []).map(p => `<tr><td>${p.method}</td><td>${new Date(p.paymentDate).toLocaleDateString()}</td><td class="text-right">K ${p.amount.toLocaleString()}</td></tr>`).join('')
    : '';

  const aptNote = appointment
    ? `<p style="font-size:11px;color:#888;margin-top:4px;">Linked Appointment: ${appointment.type || 'Appointment'} on ${new Date(appointment.startTime).toLocaleDateString()}</p>`
    : '';

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8">${baseStyles()}</head>
    <body>
      ${clinicHeader()}
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
        <div>
          <h2>INVOICE</h2>
          <div style="font-size:13px;color:#555;margin-top:4px;">${invoice.invoiceNumber}</div>
          ${aptNote}
        </div>
        <div style="text-align:right;">
          ${statusBadge}
          <div style="margin-top:8px;font-size:11px;color:#888;">Date: ${new Date(invoice.date).toLocaleDateString()}</div>
          <div style="font-size:11px;color:#888;">Due: ${new Date(invoice.dueDate).toLocaleDateString()}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-block">
          <div class="label">Bill To</div>
          <div style="font-weight:700;font-size:14px;">${patient?.displayName || 'Unknown'}</div>
          <div style="color:#555;margin-top:2px;">${patient?.patientCode || ''}</div>
          <div style="color:#555;">${patient?.phone || ''}</div>
          <div style="color:#555;">${patient?.email || ''}</div>
        </div>
        <div class="info-block">
          <div class="label">Invoice Details</div>
          <div><strong>Number:</strong> ${invoice.invoiceNumber}</div>
          <div><strong>Created by:</strong> ${creatorName || 'Staff'}</div>
          <div><strong>Created:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div class="section">
        <h3 style="margin-bottom:10px;">Line Items</h3>
        <table>
          <thead><tr><th>Description</th><th class="text-center">Qty</th><th class="text-right">Unit Price</th><th class="text-right">Total</th></tr></thead>
          <tbody>${lineRows}</tbody>
        </table>
        <div class="total-box">
          <div class="total-row"><span>Subtotal</span><span>K ${invoice.subtotal.toLocaleString()}</span></div>
          <div class="total-row"><span>Tax</span><span>K ${invoice.tax.toLocaleString()}</span></div>
          <div class="total-row total-final"><span>Total</span><span>K ${invoice.total.toLocaleString()}</span></div>
          ${outstanding > 0 ? `<div class="total-row" style="color:#c62828;"><span>Outstanding Balance</span><span>K ${outstanding.toLocaleString()}</span></div>` : ''}
        </div>
      </div>

      ${paymentRows ? `
        <div class="section">
          <h3 style="margin-bottom:10px;">Payment History</h3>
          <table>
            <thead><tr><th>Method</th><th>Date</th><th class="text-right">Amount</th></tr></thead>
            <tbody>${paymentRows}</tbody>
          </table>
        </div>
      ` : ''}

      ${invoice.notes ? `<div class="section"><h3>Notes</h3><p style="color:#555;margin-top:6px;">${invoice.notes}</p></div>` : ''}

      <div class="footer">
        <div>${CLINIC_NAME} &bull; ${CLINIC_EMAIL} &bull; ${CLINIC_PHONE}</div>
        <div style="margin-top:4px;">Thank you for choosing ${CLINIC_NAME}</div>
      </div>
    </body></html>
  `;
}

export async function downloadInvoicePDF(htmlContent, invoiceNumber) {
  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
    const fileName = `Invoice_${invoiceNumber}_${Date.now()}.pdf`;
    const destUri = FileSystem.documentDirectory + fileName;
    await FileSystem.moveAsync({ from: uri, to: destUri });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(destUri, {
        mimeType: 'application/pdf',
        dialogTitle: `Invoice ${invoiceNumber}`,
        UTI: 'com.adobe.pdf',
      });
    }
    return { success: true, uri: destUri };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ── CSV Helpers ───────────────────────────────────────────────────────────────
function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(headers, rows) {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map(row => row.map(escapeCSV).join(','));
  return [headerRow, ...dataRows].join('\n');
}

function csvClinicHeader(title) {
  return [
    `"${CLINIC_NAME}"`,
    `"${CLINIC_TAGLINE}"`,
    `"${CLINIC_ADDRESS} | ${CLINIC_PHONE} | ${CLINIC_EMAIL}"`,
    `"${title}"`,
    `"Generated: ${new Date().toLocaleString()}"`,
    '',
  ].join('\n');
}

export async function exportPaymentsCSV(payments, patientMap) {
  const header = csvClinicHeader('PAYMENTS REPORT');
  const cols = ['Date', 'Patient', 'Invoice', 'Method', 'Amount (K)', 'Reference', 'Status'];
  const rows = payments.map(p => [
    new Date(p.paymentDate).toLocaleDateString(),
    patientMap[p.patientId]?.displayName || '',
    p.invoiceId || '',
    p.method || '',
    p.amount,
    p.referenceNumber || '',
    p.status || '',
  ]);
  const csv = header + buildCSV(cols, rows);
  return _shareCSV(csv, `Payments_${Date.now()}.csv`);
}

export async function exportExpensesCSV(expenses) {
  const header = csvClinicHeader('EXPENSES REPORT');
  const cols = ['Date', 'Description', 'Category', 'Vendor', 'Amount (K)', 'Notes'];
  const rows = expenses.map(e => [
    new Date(e.date).toLocaleDateString(),
    e.description || '',
    e.category || '',
    e.vendorName || '',
    e.amount,
    e.notes || '',
  ]);
  const csv = header + buildCSV(cols, rows);
  return _shareCSV(csv, `Expenses_${Date.now()}.csv`);
}

export async function exportStockCSV(items) {
  const header = csvClinicHeader('STOCK INVENTORY REPORT');
  const cols = ['Item Code', 'Name', 'Stock Level', 'Reorder Level', 'Price (K)', 'Cost Price (K)', 'Tax Type', 'Expiry Date', 'Status'];
  const rows = items.map(i => [
    i.itemCode || '',
    i.name || '',
    i.stockLevel,
    i.reorderLevel,
    i.pricePerItem,
    i.costPrice,
    i.taxType || '',
    i.expiryDate ? new Date(i.expiryDate).toLocaleDateString() : '',
    i.status || '',
  ]);
  const csv = header + buildCSV(cols, rows);
  return _shareCSV(csv, `Stock_${Date.now()}.csv`);
}

async function _shareCSV(csv, fileName) {
  try {
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: fileName,
        UTI: 'public.comma-separated-values-text',
      });
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
