import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def markdown_to_pdf(md_filepath, pdf_filepath, doc_title):
    with open(md_filepath, "r", encoding="utf-8") as f:
        content = f.read()

    doc = SimpleDocTemplate(
        pdf_filepath,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e1b4b"),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'CustomH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#312e81"),
        spaceBefore=14,
        spaceAfter=8
    )

    h2_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#4338ca"),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    quote_style = ParagraphStyle(
        'CustomQuote',
        parent=body_style,
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#3730a3"),
        backColor=colors.HexColor("#eef2ff"),
        borderColor=colors.HexColor("#6366f1"),
        borderWidth=1,
        borderPadding=6,
        spaceBefore=6,
        spaceAfter=6
    )

    code_style = ParagraphStyle(
        'CustomCode',
        parent=body_style,
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f8fafc"),
        borderColor=colors.HexColor("#cbd5e1"),
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=6,
        spaceAfter=6
    )

    table_text = ParagraphStyle(
        'TableText',
        parent=body_style,
        fontSize=8.5,
        leading=11,
        spaceAfter=0
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=body_style,
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        spaceAfter=0
    )

    story = []
    
    # Process lines / blocks
    lines = content.split('\n')
    i = 0
    in_code_block = False
    code_block_lines = []
    in_table = False
    table_rows = []

    def format_text(txt):
        # bold **text**
        txt = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', txt)
        # italic *text*
        txt = re.sub(r'\*(.*?)\*', r'<i>\1</i>', txt)
        # inline code `text`
        txt = re.sub(r'`(.*?)`', r'<font name="Courier" color="#4338ca">\1</font>', txt)
        # clean html special chars if needed
        txt = txt.replace("& ", "&amp; ")
        return txt

    while i < len(lines):
        line = lines[i]

        # Code block
        if line.strip().startswith("```"):
            if in_code_block:
                # End code block
                code_text = "\n".join(code_block_lines)
                formatted_code = format_text(code_text).replace('\n', '<br/>').replace(' ', '&nbsp;')
                story.append(Paragraph(formatted_code, code_style))
                code_block_lines = []
                in_code_block = False
            else:
                in_code_block = True
                code_block_lines = []
            i += 1
            continue

        if in_code_block:
            code_block_lines.append(line)
            i += 1
            continue

        # Table row
        if '|' in line and not line.strip().startswith("```"):
            parts = [p.strip() for p in line.split('|')[1:-1]]
            if parts and not all(set(p) <= set(':- ') for p in parts):
                if not in_table:
                    in_table = True
                    table_rows = []
                table_rows.append(parts)
            i += 1
            continue
        elif in_table:
            # End of table
            if table_rows:
                # Create reportlab table
                processed_table = []
                for row_idx, row in enumerate(table_rows):
                    row_data = []
                    style = table_header if row_idx == 0 else table_text
                    for col in row:
                        row_data.append(Paragraph(format_text(col), style))
                    processed_table.append(row_data)

                t = Table(processed_table, colWidths=None)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#312e81")),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ]))
                story.append(t)
                story.append(Spacer(1, 8))
            in_table = False
            table_rows = []

        line_str = line.strip()
        if not line_str:
            i += 1
            continue

        if line_str.startswith("# "):
            story.append(Paragraph(format_text(line_str[2:]), title_style))
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4338ca"), spaceBefore=2, spaceAfter=10))
        elif line_str.startswith("## "):
            story.append(Paragraph(format_text(line_str[3:]), h1_style))
        elif line_str.startswith("### "):
            story.append(Paragraph(format_text(line_str[4:]), h2_style))
        elif line_str.startswith("---"):
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=6, spaceAfter=6))
        elif line_str.startswith(">"):
            quote_txt = line_str.lstrip("> ").strip()
            story.append(Paragraph(format_text(quote_txt), quote_style))
        elif line_str.startswith("- ") or line_str.startswith("* "):
            bullet_txt = "• " + line_str[2:]
            story.append(Paragraph(format_text(bullet_txt), bullet_style))
        elif re.match(r'^\d+\.\s', line_str):
            story.append(Paragraph(format_text(line_str), bullet_style))
        else:
            story.append(Paragraph(format_text(line_str), body_style))

        i += 1

    doc.build(story)
    print(f"Generated PDF: {pdf_filepath}")

if __name__ == "__main__":
    markdown_to_pdf("RESEARCH.md", "RESEARCH_NOTE.pdf", "Research Note")
    markdown_to_pdf("DESIGN.md", "DESIGN_NOTE.pdf", "Design Note")
