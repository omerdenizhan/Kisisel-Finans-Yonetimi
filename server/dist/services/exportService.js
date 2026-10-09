import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { getDb } from '../db/connection.js';
import { formatCurrency } from '../utils/currency.js';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import path from 'path';
import fs from 'fs';
const TRY = 'TRY';
const LOCALE = 'tr-TR';
// Android / Termux için Roboto font yolları
const getRobotoFont = (isBold) => {
    // Android sisteminde bulunan olası Roboto font yolları
    const fontName = isBold ? 'Roboto-Bold.ttf' : 'Roboto-Regular.ttf';
    const alternativeName = isBold ? 'DroidSans-Bold.ttf' : 'DroidSans.ttf';
    const possiblePaths = [
        path.join('/system/fonts', fontName),
        path.join('/system/fonts', alternativeName),
    ];
    // Windows'ta test edilmek istenirse yedek yol
    if (process.platform === 'win32') {
        const windir = process.env.WINDIR || 'C:\\Windows';
        const winFont = path.join(windir, 'Fonts', isBold ? 'arialbd.ttf' : 'arial.ttf');
        if (fs.existsSync(winFont))
            return winFont;
    }
    // Sistemde mevcut olan ilk fontu seç
    for (const fontPath of possiblePaths) {
        if (fs.existsSync(fontPath)) {
            return fontPath;
        }
    }
    // Hiçbiri bulunamazsa PDFKit'in dahili fontuna dön (uygulama çökmez)
    return isBold ? 'Helvetica-Bold' : 'Helvetica';
};
const FONT_NORMAL = getRobotoFont(false);
const FONT_BOLD = getRobotoFont(true);
function setFilename(res, name) {
    // Türkçe karakterler için RFC 5987
    const ascii = name.replace(/[^\x20-\x7E]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`);
}
function fetchTransactions(f) {
    const where = [];
    const params = [];
    if (f.dateFrom) {
        where.push('t.date >= ?');
        params.push(f.dateFrom);
    }
    if (f.dateTo) {
        where.push('t.date <= ?');
        params.push(f.dateTo);
    }
    if (f.categoryId) {
        where.push('t.category_id = ?');
        params.push(f.categoryId);
    }
    if (f.type) {
        where.push('t.type = ?');
        params.push(f.type);
    }
    if (f.q) {
        where.push('(t.description LIKE ? OR t.notes LIKE ?)');
        params.push(`%${f.q}%`, `%${f.q}%`);
    }
    const sql = `
    SELECT t.*, c.name as category_name
    FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY t.date DESC, t.id DESC
  `;
    return getDb().prepare(sql).all(...params);
}
export async function exportTransactionsPdf(res, f) {
    const rows = fetchTransactions(f);
    const filename = `islemler-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    setFilename(res, filename);
    res.setHeader('Content-Type', 'application/pdf');
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: 'İşlemler', Author: 'Yerel Finance' } });
    doc.registerFont('DejaVuSans', FONT_NORMAL).registerFont('DejaVuSans-Bold', FONT_BOLD);
    doc.font('DejaVuSans');
    doc.pipe(res);
    // Başlık
    doc.fontSize(20).fillColor('#1e1b4b').text('İşlem Listesi', { align: 'left' });
    doc.fontSize(9).fillColor('#64748b').text(`Oluşturma: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })}`, { align: 'left' });
    if (f.dateFrom || f.dateTo) {
        doc.text(`Tarih aralığı: ${f.dateFrom ?? '…'} → ${f.dateTo ?? '…'}`);
    }
    doc.moveDown(0.5);
    // Tablo başlıkları
    const startX = 40;
    let y = doc.y + 8;
    const cols = [
        { key: 'date', label: 'Tarih', x: startX, w: 70 },
        { key: 'type', label: 'Tür', x: startX + 70, w: 50 },
        { key: 'category', label: 'Kategori', x: startX + 120, w: 110 },
        { key: 'description', label: 'Açıklama', x: startX + 230, w: 180 },
        { key: 'amount', label: 'Tutar', x: startX + 410, w: 110, align: 'right' },
    ];
    const drawHeader = () => {
        doc.fontSize(10).fillColor('#475569');
        for (const c of cols) {
            doc.text(c.label, c.x, y, { width: c.w, align: c.align ?? 'left', lineBreak: false });
        }
        doc.moveTo(startX, y + 14).lineTo(555, y + 14).strokeColor('#cbd5e1').stroke();
        y += 18;
    };
    drawHeader();
    let income = 0, expense = 0;
    doc.fontSize(9).fillColor('#0f172a');
    for (const r of rows) {
        if (y > 780) {
            doc.addPage();
            y = 40;
            drawHeader();
            doc.fontSize(9).fillColor('#0f172a');
        }
        if (r.type === 'income')
            income += r.amount;
        else
            expense += r.amount;
        doc.text(format(parseISO(r.date), 'dd.MM.yyyy'), cols[0].x, y, { width: cols[0].w, lineBreak: false });
        doc.fillColor(r.type === 'income' ? '#10b981' : '#ef4444')
            .text(r.type === 'income' ? 'Gelir' : 'Gider', cols[1].x, y, { width: cols[1].w, lineBreak: false })
            .fillColor('#0f172a');
        doc.text(r.category_name ?? '—', cols[2].x, y, { width: cols[2].w, lineBreak: false });
        doc.text((r.description ?? '').slice(0, 50), cols[3].x, y, { width: cols[3].w, lineBreak: false });
        const sign = r.type === 'income' ? '+' : '−';
        doc.text(`${sign} ${formatCurrency(r.amount, TRY, LOCALE)}`, cols[4].x, y, { width: cols[4].w, align: 'right', lineBreak: false });
        y += 16;
    }
    // Özet
    y += 8;
    doc.moveTo(startX, y).lineTo(555, y).strokeColor('#cbd5e1').stroke();
    y += 8;
    doc.fontSize(10).fillColor('#0f172a');
    doc.text(`Toplam Gelir: ${formatCurrency(income, TRY, LOCALE)}`, startX, y, { width: 250, lineBreak: false });
    doc.text(`Toplam Gider: ${formatCurrency(expense, TRY, LOCALE)}`, startX + 270, y, { width: 250, align: 'right', lineBreak: false });
    y += 16;
    doc.fontSize(12).fillColor(income - expense >= 0 ? '#10b981' : '#ef4444');
    doc.text(`Net: ${formatCurrency(income - expense, TRY, LOCALE)}`, startX, y);
    doc.end();
}
export async function exportTransactionsXlsx(res, f) {
    const rows = fetchTransactions(f);
    const filename = `islemler-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    setFilename(res, filename);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Yerel Finance';
    wb.created = new Date();
    const sheet = wb.addWorksheet('İşlemler');
    sheet.columns = [
        { header: 'Tarih', key: 'date', width: 14 },
        { header: 'Tür', key: 'type', width: 10 },
        { header: 'Kategori', key: 'category', width: 22 },
        { header: 'Açıklama', key: 'description', width: 40 },
        { header: 'Notlar', key: 'notes', width: 30 },
        { header: 'Tutar (₺)', key: 'amount', width: 16, style: { numFmt: '#,##0.00' } },
    ];
    // Başlık stili
    sheet.getRow(1).font = { bold: true, color: { argb: 'FF1E1B4B' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
    let income = 0, expense = 0;
    for (const r of rows) {
        if (r.type === 'income')
            income += r.amount;
        else
            expense += r.amount;
        const row = sheet.addRow({
            date: r.date,
            type: r.type === 'income' ? 'Gelir' : 'Gider',
            category: r.category_name ?? '—',
            description: r.description ?? '',
            notes: r.notes ?? '',
            amount: r.amount,
        });
        row.getCell('amount').font = { color: { argb: r.type === 'income' ? 'FF10B981' : 'FFEF4444' }, bold: true };
    }
    // Özet satırı
    sheet.addRow([]);
    const sumRow = sheet.addRow({ description: 'TOPLAM', amount: income + expense });
    sumRow.font = { bold: true };
    sheet.addRow({ description: 'Gelir', amount: income });
    sheet.addRow({ description: 'Gider', amount: expense });
    sheet.addRow({ description: 'Net', amount: income - expense }).font = { bold: true, color: { argb: income - expense >= 0 ? 'FF10B981' : 'FFEF4444' } };
    await wb.xlsx.write(res);
}
// =================== REPORT (monthly/yearly) ===================
export async function exportReportPdf(res, type, data) {
    const isMonthly = type === 'monthly';
    const filename = isMonthly
        ? `rapor-aylik-${data.month_str}.pdf`
        : `rapor-yillik-${data.year}.pdf`;
    setFilename(res, filename);
    res.setHeader('Content-Type', 'application/pdf');
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: filename, Author: 'Yerel Finance' } });
    doc.registerFont('DejaVuSans', FONT_NORMAL).registerFont('DejaVuSans-Bold', FONT_BOLD);
    doc.font('DejaVuSans');
    doc.pipe(res);
    doc.fontSize(22).fillColor('#1e1b4b').text(isMonthly ? 'Aylık Rapor' : 'Yıllık Rapor');
    doc.fontSize(11).fillColor('#64748b')
        .text(isMonthly
        ? `${format(parseISO(`${data.month_str}-01`), 'MMMM yyyy', { locale: tr })}`
        : `${data.year} yılı`);
    doc.text(`Oluşturma: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })}`);
    doc.moveDown(0.5);
    // Özet kutu
    const totals = [
        { label: 'Gelir', value: data.income ?? data.total_income, color: '#10b981' },
        { label: 'Gider', value: data.expense ?? data.total_expense, color: '#ef4444' },
        { label: 'Net', value: data.net ?? data.total_net, color: (data.net ?? data.total_net) >= 0 ? '#10b981' : '#ef4444' },
    ];
    const boxW = 160, boxH = 50, gap = 15, boxX = 40, boxY = doc.y;
    for (let i = 0; i < totals.length; i++) {
        const x = boxX + i * (boxW + gap);
        doc.roundedRect(x, boxY, boxW, boxH, 8).strokeColor('#e2e8f0').stroke();
        doc.fontSize(9).fillColor('#64748b').text(totals[i].label, x + 12, boxY + 10);
        doc.fontSize(16).fillColor(totals[i].color).text(formatCurrency(totals[i].value, TRY, LOCALE), x + 12, boxY + 24);
    }
    doc.y = boxY + boxH + 20;
    // Kategori kırılımı
    doc.moveDown(0.3);
    const breakdown = data.category_breakdown ?? [];
    if (!breakdown.length) {
        doc.fontSize(9).fillColor('#94a3b8').text('Veri yok');
        doc.moveDown(0.5);
    }
    else {
        for (const b of breakdown.slice(0, 15)) {
            const pct = b.percentage ?? 0;
            const barW = 200 * (pct / 100);
            const rowY = doc.y;
            const bx = 100; // center the ~390px block on A4
            doc.fontSize(9).fillColor('#0f172a').text(b.name, bx, rowY, { width: 200, lineBreak: false });
            doc.fillColor('#64748b').text(`${formatCurrency(b.total, TRY, LOCALE)}  (%${pct.toFixed(1)})`, bx + 200, rowY, { width: 150, align: 'right', lineBreak: false });
            doc.moveDown(0.2);
            // Bar
            const yBar = doc.y;
            doc.rect(bx, yBar, 200, 4).fillColor('#f1f5f9').fill();
            doc.rect(bx, yBar, barW, 4).fillColor(b.color ?? '#6366f1').fill();
            doc.moveDown(0.5);
        }
    }
    // Aylar tablosu (sadece yearly)
    if (!isMonthly && data.months) {
        doc.moveDown(0.5);
        doc.fontSize(13).fillColor('#1e1b4b').text('Aylık Karşılaştırma');
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor('#475569');
        const tx = 40, ty = doc.y;
        doc.text('Ay', tx, ty, { width: 80 });
        doc.text('Gelir', tx + 80, ty, { width: 130, align: 'right' });
        doc.text('Gider', tx + 210, ty, { width: 130, align: 'right' });
        doc.text('Net', tx + 340, ty, { width: 130, align: 'right' });
        doc.moveTo(tx, ty + 14).lineTo(555, ty + 14).strokeColor('#cbd5e1').stroke();
        doc.fontSize(9).fillColor('#0f172a');
        let y2 = ty + 18;
        for (const m of data.months) {
            if (y2 > 780) {
                doc.addPage();
                y2 = 40;
            }
            const monthName = format(parseISO(`${m.month}-01`), 'MMM', { locale: tr });
            doc.text(monthName, tx, y2, { width: 80 });
            doc.fillColor('#10b981').text(formatCurrency(m.income, TRY, LOCALE), tx + 80, y2, { width: 130, align: 'right' });
            doc.fillColor('#ef4444').text(formatCurrency(m.expense, TRY, LOCALE), tx + 210, y2, { width: 130, align: 'right' });
            doc.fillColor(m.net >= 0 ? '#10b981' : '#ef4444').text(formatCurrency(m.net, TRY, LOCALE), tx + 340, y2, { width: 130, align: 'right' });
            doc.fillColor('#0f172a');
            y2 += 14;
        }
    }
    doc.end();
}
export async function exportReportXlsx(res, type, data) {
    const isMonthly = type === 'monthly';
    const filename = isMonthly
        ? `rapor-aylik-${data.month_str}.xlsx`
        : `rapor-yillik-${data.year}.xlsx`;
    setFilename(res, filename);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Yerel Finance';
    wb.created = new Date();
    // Özet sayfası
    const summary = wb.addWorksheet('Özet');
    summary.columns = [{ header: 'Alan', key: 'k', width: 24 }, { header: 'Değer', key: 'v', width: 22 }];
    summary.getRow(1).font = { bold: true };
    summary.addRows([
        { k: 'Dönem', v: isMonthly ? data.month_str : String(data.year) },
        { k: 'Gelir', v: data.income ?? data.total_income ?? 0 },
        { k: 'Gider', v: data.expense ?? data.total_expense ?? 0 },
        { k: 'Net', v: data.net ?? data.total_net ?? 0 },
        { k: 'İşlem Sayısı', v: data.transaction_count ?? 0 },
    ]);
    // Kategori
    const cat = wb.addWorksheet('Kategori Kırılımı');
    cat.columns = [
        { header: 'Kategori', key: 'name', width: 24 },
        { header: 'Tür', key: 'type', width: 10 },
        { header: 'Tutar', key: 'total', width: 16, style: { numFmt: '#,##0.00' } },
        { header: '%', key: 'pct', width: 10 },
    ];
    cat.getRow(1).font = { bold: true };
    for (const b of data.category_breakdown ?? []) {
        cat.addRow({
            name: b.name,
            type: b.type === 'income' ? 'Gelir' : 'Gider',
            total: b.total,
            pct: (b.percentage ?? 0) / 100,
        });
    }
    cat.getColumn('pct').numFmt = '0.0%';
    // Aylar (sadece yearly)
    if (!isMonthly && data.months) {
        const months = wb.addWorksheet('Aylık');
        months.columns = [
            { header: 'Ay', key: 'm', width: 12 },
            { header: 'Gelir', key: 'i', width: 18, style: { numFmt: '#,##0.00' } },
            { header: 'Gider', key: 'e', width: 18, style: { numFmt: '#,##0.00' } },
            { header: 'Net', key: 'n', width: 18, style: { numFmt: '#,##0.00' } },
        ];
        months.getRow(1).font = { bold: true };
        for (const m of data.months) {
            months.addRow({ m: m.month, i: m.income, e: m.expense, n: m.net });
        }
    }
    await wb.xlsx.write(res);
}
// =================== INSTALLMENTS ===================
export async function exportInstallmentsPdf(res) {
    const db = getDb();
    const items = db
        .prepare(`SELECT i.*, c.name as category_name, c.color as category_color
       FROM installments i LEFT JOIN categories c ON c.id = i.category_id
       ORDER BY i.created_at DESC`)
        .all();
    const filename = `taksitler-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    setFilename(res, filename);
    res.setHeader('Content-Type', 'application/pdf');
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.registerFont('DejaVuSans', FONT_NORMAL).registerFont('DejaVuSans-Bold', FONT_BOLD);
    doc.font('DejaVuSans');
    doc.pipe(res);
    doc.fontSize(20).fillColor('#1e1b4b').text('Taksit Planları');
    doc.fontSize(9).fillColor('#64748b').text(`Oluşturma: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })}`);
    doc.moveDown(0.5);
    let y = doc.y;
    for (const it of items) {
        if (y > 700) {
            doc.addPage();
            y = 40;
        }
        doc.fontSize(12).fillColor('#0f172a').text(`${it.name}  —  ${formatCurrency(it.total_amount, TRY, LOCALE)}  (${it.installment_count} taksit)`);
        doc.fontSize(9).fillColor('#64748b').text(`Kategori: ${it.category_name ?? '—'} · Başlangıç: ${it.start_date}`);
        y = doc.y + 4;
        doc.moveTo(40, y).lineTo(555, y).strokeColor('#e2e8f0').stroke();
        y += 6;
        doc.moveDown(0.3);
    }
    doc.end();
}
export async function exportInstallmentsXlsx(res) {
    const db = getDb();
    const items = db
        .prepare(`SELECT i.*, c.name as category_name
       FROM installments i LEFT JOIN categories c ON c.id = i.category_id
       ORDER BY i.created_at DESC`)
        .all();
    const payments = db
        .prepare(`SELECT ip.*, i.name as installment_name
       FROM installment_payments ip JOIN installments i ON i.id = ip.installment_id
       ORDER BY i.id, ip.sequence`)
        .all();
    const filename = `taksitler-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    setFilename(res, filename);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const wb = new ExcelJS.Workbook();
    const s1 = wb.addWorksheet('Taksitler');
    s1.columns = [
        { header: 'Ad', key: 'n', width: 26 },
        { header: 'Kategori', key: 'c', width: 18 },
        { header: 'Toplam', key: 't', width: 16, style: { numFmt: '#,##0.00' } },
        { header: 'Taksit Sayısı', key: 'ic', width: 14 },
        { header: 'Aylık', key: 'ia', width: 16, style: { numFmt: '#,##0.00' } },
        { header: 'Başlangıç', key: 's', width: 14 },
    ];
    s1.getRow(1).font = { bold: true };
    for (const i of items) {
        s1.addRow({ n: i.name, c: i.category_name ?? '', t: i.total_amount, ic: i.installment_count, ia: i.installment_amount, s: i.start_date });
    }
    const s2 = wb.addWorksheet('Taksit Ödemeleri');
    s2.columns = [
        { header: 'Taksit', key: 'n', width: 26 },
        { header: 'Sıra', key: 'seq', width: 8 },
        { header: 'Vade', key: 'd', width: 14 },
        { header: 'Tutar', key: 'a', width: 16, style: { numFmt: '#,##0.00' } },
        { header: 'Ödeme Tarihi', key: 'pd', width: 14 },
        { header: 'Durum', key: 's', width: 12 },
    ];
    s2.getRow(1).font = { bold: true };
    for (const p of payments) {
        s2.addRow({
            n: p.installment_name,
            seq: p.sequence,
            d: p.due_date,
            a: p.amount,
            pd: p.paid_date ?? '',
            s: p.is_paid ? 'Ödendi' : 'Bekliyor',
        });
    }
    await wb.xlsx.write(res);
}
