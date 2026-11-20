import { jsPDF } from 'jspdf';
import type { TrustReport } from '../types/analysis';

export const RESPONSIBLE_AI_DISCLAIMER =
  'CyberNews AI provides AI-assisted preliminary analysis, not absolute proof of authenticity or falsity. Results should be independently verified using credible sources.';

export function formatReportSummaryText(report: TrustReport): string {
  const dateStr = new Date(report.createdAt).toLocaleString();
  const lines = [
    'CYBERNEWS AI — EXPLAINABLE TRUST REPORT',
    `Report ID: ${report.id}`,
    `Generated: ${dateStr}`,
    `Content Type: ${report.contentType.toUpperCase()}`,
    `Target: ${report.submittedLabel}`,
    `Overall Risk: ${report.riskLevel.toUpperCase()}`,
    `Classification: ${report.classification}`,
    `Evidence Strength: ${report.evidenceStrength.toUpperCase()}`,
    '',
    'Summary:',
    report.summary,
    '',
    'Key Findings:',
    ...(report.findings.length > 0 ? report.findings.map((f) => `• ${f}`) : ['• None recorded']),
  ];

  if (report.supportingEvidence.length > 0) {
    lines.push('', 'Supporting Evidence:', ...report.supportingEvidence.map((e) => `• ${e}`));
  }

  if (report.contradictoryEvidence.length > 0) {
    lines.push('', 'Contradictory Evidence:', ...report.contradictoryEvidence.map((e) => `• ${e}`));
  }

  if (report.sources.length > 0) {
    lines.push(
      '',
      'Referenced Sources:',
      ...report.sources.map((s) => `• ${s.title} (${s.url})`)
    );
  }

  if (report.limitations.length > 0) {
    lines.push('', 'Analysis Limitations:', ...report.limitations.map((l) => `• ${l}`));
  }

  if (report.recommendations.length > 0) {
    lines.push('', 'Recommended Actions:', ...report.recommendations.map((r) => `• ${r}`));
  }

  lines.push('', `Disclaimer: ${RESPONSIBLE_AI_DISCLAIMER}`);
  return lines.join('\n');
}

export function downloadReportAsPdf(report: TrustReport): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  let y = 48;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 48) {
      doc.addPage();
      y = 48;
    }
  };

  // Header band
  doc.setFillColor(10, 15, 30);
  doc.rect(0, 0, pageWidth, 82, 'F');
  doc.setTextColor(56, 189, 248);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CYBERNEWS AI', margin, 36);

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('EXPLAINABLE DIGITAL TRUST REPORT  |  VERIFY BEFORE YOU TRUST', margin, 54);

  doc.setTextColor(148, 163, 184);
  doc.text(`ID: ${report.id}`, pageWidth - margin, 36, { align: 'right' });
  doc.text(new Date(report.createdAt).toLocaleString(), pageWidth - margin, 54, { align: 'right' });

  y = 108;

  // Metadata summary box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, maxWidth, 74, 4, 4, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Classification:', margin + 12, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(report.classification, margin + 96, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Risk Level:', margin + 12, y + 38);
  doc.setFont('helvetica', 'normal');
  doc.text(report.riskLevel.toUpperCase(), margin + 96, y + 38);

  doc.setFont('helvetica', 'bold');
  doc.text('Evidence:', margin + 220, y + 38);
  doc.setFont('helvetica', 'normal');
  doc.text(report.evidenceStrength.toUpperCase(), margin + 280, y + 38);

  doc.setFont('helvetica', 'bold');
  doc.text('Target:', margin + 12, y + 56);
  doc.setFont('helvetica', 'normal');
  const targetLines = doc.splitTextToSize(report.submittedLabel, maxWidth - 110);
  doc.text(targetLines[0] || '', margin + 96, y + 56);

  y += 96;

  const addSection = (title: string, items: string[] | string) => {
    const list = Array.isArray(items) ? items : [items];
    if (list.length === 0) return;

    ensureSpace(36);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, margin, y);
    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    for (const item of list) {
      const prefix = Array.isArray(items) ? '• ' : '';
      const wrapped = doc.splitTextToSize(`${prefix}${item}`, maxWidth);
      ensureSpace(wrapped.length * 13 + 6);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 13 + 4;
    }
    y += 8;
  };

  if (report.mainClaim) {
    addSection('Main Claim Evaluated', report.mainClaim);
  }
  addSection('Executive Summary', report.summary);
  addSection('Key Findings', report.findings);
  if (report.supportingEvidence.length > 0) {
    addSection('Supporting Evidence', report.supportingEvidence);
  }
  if (report.contradictoryEvidence.length > 0) {
    addSection('Contradictory Evidence', report.contradictoryEvidence);
  }
  if (report.sources.length > 0) {
    addSection(
      'Referenced Sources',
      report.sources.map((s) => `${s.title} — ${s.url}`)
    );
  }
  addSection('Technical Limitations', report.limitations);
  addSection('Recommended Next Actions', report.recommendations);

  // Responsible AI Disclaimer
  ensureSpace(64);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  const discLines = doc.splitTextToSize(`Disclaimer: ${RESPONSIBLE_AI_DISCLAIMER}`, maxWidth - 20);
  const boxHeight = discLines.length * 12 + 18;
  doc.roundedRect(margin, y, maxWidth, boxHeight, 4, 4, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(discLines, margin + 10, y + 14);

  doc.save(`${report.id}.pdf`);
}
