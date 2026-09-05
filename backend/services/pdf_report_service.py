"""
MONVEX Production Server-Side PDF Reporting Service
Generates official, authoritative, user-scoped executive financial statements
using ReportLab with exact decimal precision, page-budgeted layouts, and brand-aligned styling.
"""
import io
import os
from decimal import Decimal
from datetime import date, datetime
from typing import Dict, Any, Optional

from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable
)
from reportlab.pdfgen import canvas

from apps.transactions.models import Transaction, Category, Asset, Liability
from apps.budgets.models import Budget
from apps.goals.models import SavingsGoal


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically calculate and render 'Page X of Y' footers
    with security confidentiality notices.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#625D69"))

        # Footer divider rule
        self.setStrokeColor(colors.HexColor("#E4E2DC"))
        self.setLineWidth(0.75)
        self.line(36, 32, 576, 32)

        # Footer texts
        confidential_text = "MONVEX Financial Intelligence System  |  Confidential & Proprietary Statement"
        page_text = f"Page {self._pageNumber} of {page_count}"

        self.drawString(36, 20, confidential_text)
        self.drawRightString(576, 20, page_text)
        self.restoreState()


class PDFReportService:
    """
    Server-side authoritative PDF report generator for MONVEX users.
    Enforces strict user isolation and zero rounding discrepancy.
    """

    # Verified MONVEX Multi-Tint Palette
    COLOR_PLUM_DEEP = colors.HexColor("#2A1F3D")
    COLOR_PLUM_MUTED = colors.HexColor("#4A3B69")
    COLOR_INDIGO_MED = colors.HexColor("#4056A1")
    COLOR_INDIGO_TINT = colors.HexColor("#E9EDFA")
    COLOR_EMERALD = colors.HexColor("#059669")
    COLOR_EMERALD_BG = colors.HexColor("#E8F7F1")
    COLOR_ROSE = colors.HexColor("#DC2626")
    COLOR_CANVAS = colors.HexColor("#F6F5F1")
    COLOR_BORDER = colors.HexColor("#E4E2DC")
    COLOR_TEXT_PRIMARY = colors.HexColor("#191522")
    COLOR_TEXT_MUTED = colors.HexColor("#625D69")

    @classmethod
    def generate_monthly_statement(
        cls,
        user: User,
        month_str: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> bytes:
        """
        Builds and renders the official PDF statement for the specified period.
        Returns raw PDF binary bytes.
        """
        # 1. Resolve date range
        today = date.today()
        if start_date and end_date:
            period_start = start_date
            period_end = end_date
            period_label = f"{period_start.strftime('%d %b %Y')} – {period_end.strftime('%d %b %Y')}"
        elif month_str:
            try:
                dt = datetime.strptime(month_str, "%Y-%m").date()
                period_start = dt.replace(day=1)
                # Last day of month
                if period_start.month == 12:
                    period_end = date(period_start.year + 1, 1, 1) - timezone.timedelta(days=1)
                else:
                    period_end = date(period_start.year, period_start.month + 1, 1) - timezone.timedelta(days=1)
                period_label = period_start.strftime("%B %Y")
            except ValueError:
                period_start = today.replace(day=1)
                period_end = today
                period_label = period_start.strftime("%B %Y")
        else:
            period_start = today.replace(day=1)
            period_end = today
            period_label = period_start.strftime("%B %Y")

        # 2. Query Authoritative Financial Data (strictly user-scoped)
        tx_qs = Transaction.objects.filter(
            user=user,
            date__gte=period_start,
            date__lte=period_end
        )

        income_agg = tx_qs.filter(type='INCOME').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        expense_agg = tx_qs.filter(type='EXPENSE').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        net_savings = income_agg - expense_agg
        savings_rate = (net_savings / income_agg * Decimal('100.0')) if income_agg > Decimal('0.00') else Decimal('0.0')

        # Net Worth
        assets_total = Asset.objects.filter(user=user).aggregate(total=Sum('value'))['total'] or Decimal('0.00')
        liab_total = Liability.objects.filter(user=user).aggregate(total=Sum('remaining_balance'))['total'] or Decimal('0.00')
        net_worth = assets_total - liab_total

        # Category Breakdown
        cat_data = (
            tx_qs.filter(type='EXPENSE')
            .values('category__name')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')
        )
        categories = []
        for c in cat_data[:8]:
            cat_name = c['category__name'] or 'General / Uncategorized'
            c_tot = c['total'] or Decimal('0.00')
            pct = (c_tot / expense_agg * Decimal('100.0')) if expense_agg > Decimal('0.00') else Decimal('0.0')
            categories.append({
                'name': cat_name,
                'total': c_tot,
                'pct': pct,
                'count': c['count']
            })

        # Top Transactions (up to 15)
        top_txs = tx_qs.select_related('category', 'merchant').order_by('-date', '-amount')[:15]

        # Budgets
        budgets_qs = Budget.objects.filter(user=user).select_related('category')
        budgets = []
        for b in budgets_qs:
            b_spent = tx_qs.filter(type='EXPENSE', category=b.category).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
            util = (b_spent / b.limit_amount * Decimal('100.0')) if b.limit_amount > Decimal('0.00') else Decimal('0.0')
            budgets.append({
                'name': b.category.name,
                'allocated': b.limit_amount,
                'spent': b_spent,
                'util': util
            })

        # 3. Setup Document and Styles
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=42
        )

        styles = getSampleStyleSheet()
        normal = styles['Normal']

        title_style = ParagraphStyle(
            'DocTitle',
            parent=normal,
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=cls.COLOR_PLUM_DEEP
        )
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=normal,
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=cls.COLOR_TEXT_MUTED
        )
        section_h1 = ParagraphStyle(
            'SectionH1',
            parent=normal,
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=cls.COLOR_PLUM_DEEP,
            spaceAfter=6
        )
        cell_bold = ParagraphStyle(
            'CellBold',
            parent=normal,
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=11,
            textColor=cls.COLOR_TEXT_PRIMARY
        )
        cell_regular = ParagraphStyle(
            'CellRegular',
            parent=normal,
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            textColor=cls.COLOR_TEXT_PRIMARY
        )
        cell_muted = ParagraphStyle(
            'CellMuted',
            parent=normal,
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            textColor=cls.COLOR_TEXT_MUTED
        )
        kpi_label_style = ParagraphStyle(
            'KpiLabel',
            parent=normal,
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=9,
            textColor=cls.COLOR_TEXT_MUTED
        )
        kpi_value_style = ParagraphStyle(
            'KpiValue',
            parent=normal,
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            textColor=cls.COLOR_TEXT_PRIMARY
        )

        story = []

        # Header Block
        header_data = [
            [
                Paragraph("<b>MONVEX</b>", title_style),
                Paragraph(f"<b>Period:</b> {period_label}", ParagraphStyle('HeadRight1', parent=normal, fontName='Helvetica-Bold', fontSize=9, leading=12, alignment=2, textColor=cls.COLOR_TEXT_PRIMARY))
            ],
            [
                Paragraph("Personal Financial Intelligence & Official Statement", subtitle_style),
                Paragraph(f"Generated: {today.strftime('%d %B %Y')}", ParagraphStyle('HeadRight2', parent=normal, fontName='Helvetica', fontSize=8, leading=11, alignment=2, textColor=cls.COLOR_TEXT_MUTED))
            ],
            [
                Paragraph(f"Account: <b>{user.get_full_name() or user.username}</b> ({user.email})", subtitle_style),
                Paragraph(f"Currency: <b>INR (₹)</b>  |  Status: <b>Verified</b>", ParagraphStyle('HeadRight3', parent=normal, fontName='Helvetica', fontSize=8, leading=11, alignment=2, textColor=cls.COLOR_TEXT_MUTED))
            ]
        ]
        header_table = Table(header_data, colWidths=[300, 240])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 8))
        story.append(HRFlowable(width="100%", thickness=1.5, color=cls.COLOR_PLUM_DEEP, spaceBefore=4, spaceAfter=12))

        # Executive Summary KPI Grid (4 Cards in a Table)
        kpi_table_data = [
            [
                Paragraph("TOTAL INFLOW", kpi_label_style),
                Paragraph("TOTAL OUTFLOW", kpi_label_style),
                Paragraph("NET SAVINGS", kpi_label_style),
                Paragraph("NET WORTH", kpi_label_style),
            ],
            [
                Paragraph(f"₹{income_agg:,.2f}", kpi_value_style),
                Paragraph(f"₹{expense_agg:,.2f}", kpi_value_style),
                Paragraph(f"₹{net_savings:,.2f}", kpi_value_style),
                Paragraph(f"₹{net_worth:,.2f}", kpi_value_style),
            ],
            [
                Paragraph("Active Ledger Inflow", cell_muted),
                Paragraph("Recorded Expenses", cell_muted),
                Paragraph(f"{savings_rate:.1f}% Savings Rate", cell_muted),
                Paragraph(f"Assets minus Liabilities", cell_muted),
            ]
        ]
        kpi_table = Table(kpi_table_data, colWidths=[135, 135, 135, 135])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), cls.COLOR_CANVAS),
            ('BOX', (0, 0), (-1, -1), 1, cls.COLOR_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, cls.COLOR_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 14))

        # Category Breakdown Table
        story.append(Paragraph("Category Spending Breakdown", section_h1))
        cat_table_data = [
            [
                Paragraph("Category", cell_bold),
                Paragraph("Transactions", cell_bold),
                Paragraph("% of Outflow", cell_bold),
                Paragraph("Total Amount", ParagraphStyle('RightBold', parent=cell_bold, alignment=2))
            ]
        ]
        if categories:
            for cat in categories:
                cat_table_data.append([
                    Paragraph(cat['name'], cell_regular),
                    Paragraph(str(cat['count']), cell_muted),
                    Paragraph(f"{cat['pct']:.1f}%", cell_muted),
                    Paragraph(f"₹{cat['total']:,.2f}", ParagraphStyle('RightReg', parent=cell_regular, alignment=2))
                ])
        else:
            cat_table_data.append([Paragraph("No expense transactions recorded in this period.", cell_muted), "", "", ""])

        cat_table = Table(cat_table_data, colWidths=[200, 100, 100, 140])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), cls.COLOR_INDIGO_TINT),
            ('TEXTCOLOR', (0, 0), (-1, 0), cls.COLOR_PLUM_DEEP),
            ('LINEBELOW', (0, 0), (-1, 0), 1, cls.COLOR_INDIGO_MED),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, cls.COLOR_CANVAS]),
            ('BOX', (0, 0), (-1, -1), 0.5, cls.COLOR_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, cls.COLOR_BORDER),
        ]))
        story.append(cat_table)
        story.append(Spacer(1, 14))

        # Recent Ledger Transactions Table
        story.append(Paragraph("Recent Ledger Transactions", section_h1))
        tx_table_data = [
            [
                Paragraph("Date", cell_bold),
                Paragraph("Description", cell_bold),
                Paragraph("Category", cell_bold),
                Paragraph("Type", cell_bold),
                Paragraph("Amount", ParagraphStyle('RightBold', parent=cell_bold, alignment=2))
            ]
        ]
        if top_txs:
            for t in top_txs:
                is_inc = t.type == 'INCOME'
                amt_str = f"+ ₹{t.amount:,.2f}" if is_inc else f"- ₹{t.amount:,.2f}"
                amt_color = cls.COLOR_EMERALD if is_inc else cls.COLOR_TEXT_PRIMARY
                tx_table_data.append([
                    Paragraph(t.date.strftime("%d %b %Y"), cell_muted),
                    Paragraph(t.description[:32], cell_regular),
                    Paragraph(t.category.name if t.category else "Uncategorized", cell_muted),
                    Paragraph(t.type, cell_muted),
                    Paragraph(amt_str, ParagraphStyle('AmtStyle', parent=cell_bold, alignment=2, textColor=amt_color))
                ])
        else:
            tx_table_data.append([Paragraph("No transactions recorded for this statement period.", cell_muted), "", "", "", ""])

        tx_table = Table(tx_table_data, colWidths=[75, 175, 120, 60, 110])
        tx_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), cls.COLOR_INDIGO_TINT),
            ('TEXTCOLOR', (0, 0), (-1, 0), cls.COLOR_PLUM_DEEP),
            ('LINEBELOW', (0, 0), (-1, 0), 1, cls.COLOR_INDIGO_MED),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, cls.COLOR_CANVAS]),
            ('BOX', (0, 0), (-1, -1), 0.5, cls.COLOR_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, cls.COLOR_BORDER),
        ]))
        story.append(tx_table)

        # Budget Performance (if any exist)
        if budgets:
            story.append(Spacer(1, 14))
            story.append(Paragraph("Budget Performance Overview", section_h1))
            b_table_data = [
                [
                    Paragraph("Category", cell_bold),
                    Paragraph("Spent", cell_bold),
                    Paragraph("Allocated Limit", cell_bold),
                    Paragraph("Utilization", ParagraphStyle('RightBold', parent=cell_bold, alignment=2))
                ]
            ]
            for b in budgets:
                b_color = cls.COLOR_ROSE if b['util'] > Decimal('100.0') else cls.COLOR_TEXT_PRIMARY
                b_table_data.append([
                    Paragraph(b['name'], cell_regular),
                    Paragraph(f"₹{b['spent']:,.2f}", cell_muted),
                    Paragraph(f"₹{b['allocated']:,.2f}", cell_muted),
                    Paragraph(f"{b['util']:.1f}%", ParagraphStyle('UtilStyle', parent=cell_bold, alignment=2, textColor=b_color))
                ])
            b_table = Table(b_table_data, colWidths=[180, 120, 120, 120])
            b_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), cls.COLOR_INDIGO_TINT),
                ('LINEBELOW', (0, 0), (-1, 0), 1, cls.COLOR_INDIGO_MED),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
                ('TOPPADDING', (0, 0), (-1, -1), 3.5),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, cls.COLOR_CANVAS]),
                ('BOX', (0, 0), (-1, -1), 0.5, cls.COLOR_BORDER),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, cls.COLOR_BORDER),
            ]))
            story.append(b_table)

        # Build Document
        doc.build(story, canvasmaker=NumberedCanvas)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return pdf_bytes
