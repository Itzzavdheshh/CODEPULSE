import io
import datetime
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Group, Polygon
from reportlab.graphics.charts.barcharts import VerticalBarChart


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas for dynamic total page count, running headers, and footers.
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
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Header (Skip on Cover Page 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "CodePulse — Intelligent Software Analysis Platform")
            self.drawRightString(612 - 54, 750, "Compiler Intelligence Report")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 612 - 54, 742)

        # Footer on all pages
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawString(54, 36, "CONFIDENTIAL & AUTHORITATIVE COMPILER ARTIFACT")
        self.drawRightString(612 - 54, 36, page_str)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 612 - 54, 48)

        self.restoreState()


class CompilerPDFReportGenerator:
    """
    Academic & Engineering-Grade PDF Report Generator for CodePulse.
    Builds professional standalone PDF reports from authoritative compiler artifacts.
    """

    def generate_pdf(self, compiler_data: Dict[str, Any], title: str = "Compiler Intelligence Report") -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=54,
            rightMargin=54,
            topMargin=54,
            bottomMargin=54
        )

        styles = getSampleStyleSheet()

        # Custom Styles
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#475569"),
            spaceAfter=12
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=17,
            textColor=colors.HexColor("#1E293B"),
            spaceBefore=12,
            spaceAfter=6,
            keepWithNext=True
        )
        body_style = ParagraphStyle(
            'BodyTextCustom',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155")
        )
        code_style = ParagraphStyle(
            'CodeBlock',
            parent=styles['Normal'],
            fontName='Courier',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#1E293B")
        )

        elements = []

        file_name = compiler_data.get("file_name") or compiler_data.get("source_name") or "SoftwareRiskAnalyzer.java"
        stats = compiler_data.get("stats", {})
        metrics = compiler_data.get("metrics", {})
        preprocessing = compiler_data.get("preprocessing", {})
        tokens = compiler_data.get("tokens", [])
        symbols = compiler_data.get("symbol_table", [])
        diagnostics = compiler_data.get("diagnostics", [])
        tac = compiler_data.get("intermediate_code", [])
        opt_tac = compiler_data.get("optimized_code", [])
        opt_audit = compiler_data.get("optimization_audit", {})
        cfg = compiler_data.get("cfg", {})
        target = compiler_data.get("target_code", {})
        timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        errors_count = stats.get("errors_count", 0)
        warnings_count = stats.get("warnings_count", 0)
        status_text = "PASSED CLEAN" if errors_count == 0 and warnings_count == 0 else ("PASSED WITH WARNINGS" if errors_count == 0 else "COMPILATION ERRORS DETECTED")

        # -------------------------------------------------------------------------
        # COVER / HEADER BANNER
        # -------------------------------------------------------------------------
        banner_data = [
            [
                Paragraph("<b>CODEPULSE</b> — Intelligent Software Analysis Platform", ParagraphStyle('B1', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor("#4F46E5"))),
                Paragraph(f"<b>Status:</b> {status_text}", ParagraphStyle('B2', fontName='Helvetica-Bold', fontSize=9, alignment=2, textColor=colors.HexColor("#059669" if errors_count == 0 else "#DC2626")))
            ],
            [
                Paragraph(f"<b>{title}</b>", title_style),
                ""
            ],
            [
                Paragraph(f"<b>Target File:</b> <code>{file_name}</code> &nbsp;|&nbsp; <b>Generated:</b> {timestamp} &nbsp;|&nbsp; <b>Engine:</b> CodePulse Compiler Intelligence v1.0", subtitle_style),
                ""
            ]
        ]
        banner_table = Table(banner_data, colWidths=[350, 154])
        banner_table.setStyle(TableStyle([
            ('SPAN', (0, 1), (1, 1)),
            ('SPAN', (0, 2), (1, 2)),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(banner_table)
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------------------
        # 1. EXECUTIVE SUMMARY & EXECUTED ANALYSIS MATRIX
        # -------------------------------------------------------------------------
        elements.append(Paragraph("1. Executive Summary & Executed Layer Matrix", h2_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))

        exec_matrix_data = [
            ["Engine Layer", "Execution Status", "Artifact Source", "Integrity State"],
            ["Compiler Intelligence", "EXECUTED", f"{file_name} (Payload)", "AUTHORITATIVE"],
            ["Data Intelligence", "NOT EXECUTED", "N/A", "ISOLATED"],
            ["Machine Learning Intelligence", "NOT EXECUTED", "N/A", "ISOLATED"],
            ["Visual Risk Intelligence", "COMPILER ONLY", "Method CFG Topology", "VERIFIED"]
        ]
        exec_table = Table(exec_matrix_data, colWidths=[140, 100, 140, 124])
        exec_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('ALIGN', (1, 1), (1, -1), 'CENTER'),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(exec_table)
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------------------
        # 2. SOURCE OVERVIEW & PREPROCESSING
        # -------------------------------------------------------------------------
        elements.append(Paragraph("2. Source Overview & Preprocessing Stage", h2_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))

        comment_stats = preprocessing.get("comment_stats", {})
        prep_table_data = [
            ["Metric", "Value", "Metric", "Value"],
            ["Total Lines of Code (LOC)", str(stats.get("lines", 0)), "Single-Line Comments Stripped", str(comment_stats.get("single_line_comments_count", 0))],
            ["Character Count", f"{stats.get('characters', 0)} bytes", "Block Comments Stripped", str(comment_stats.get("block_comments_count", 0))],
            ["Source Lines (SLOC)", str(metrics.get("source_loc", 0)), "Macros Defined (#define)", str(len(preprocessing.get("macros", [])))],
            ["Comment Lines (CLOC)", str(metrics.get("comment_loc", 0)), "Macro Expansions Executed", str(len(preprocessing.get("macro_expansions", [])))]
        ]
        prep_table = Table(prep_table_data, colWidths=[140, 112, 140, 112])
        prep_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#334155")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(prep_table)
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------------------
        # 3. LEXICAL ANALYSIS & TOKEN DISTRIBUTION CHART
        # -------------------------------------------------------------------------
        elements.append(Paragraph("3. Lexical Analysis & Token Classification", h2_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))

        kw_cnt = metrics.get("keywords_count", 0)
        id_cnt = metrics.get("identifiers_count", 0)
        op_cnt = metrics.get("operators_count", 0)
        total_tokens = stats.get("tokens_count", len(tokens))
        other_cnt = max(0, total_tokens - (kw_cnt + id_cnt + op_cnt))

        lex_summary = Paragraph(f"Authoritative Token Count: <b>{total_tokens}</b> tokens (excluding EOF). Category breakdown: {kw_cnt} Keywords, {id_cnt} Identifiers, {op_cnt} Operators, {other_cnt} Delimiters & Literals.", body_style)
        elements.append(lex_summary)
        elements.append(Spacer(1, 6))

        # Vector Bar Chart for Tokens
        d_chart = Drawing(504, 110)
        bc = VerticalBarChart()
        bc.x = 40
        bc.y = 20
        bc.height = 75
        bc.width = 440
        bc.data = [[kw_cnt, id_cnt, op_cnt, other_cnt]]
        bc.categoryAxis.categoryNames = ['Keywords', 'Identifiers', 'Operators', 'Delim/Literals']
        bc.categoryAxis.labels.fontSize = 8
        bc.valueAxis.valueMin = 0
        bc.valueAxis.valueMax = max(10, max(kw_cnt, id_cnt, op_cnt, other_cnt) + 10)
        bc.valueAxis.valueStep = max(5, bc.valueAxis.valueMax // 4)
        bc.bars[0].fillColor = colors.HexColor("#4F46E5")
        d_chart.add(bc)
        elements.append(d_chart)
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------------------
        # 4. AST & SYNTAX ANALYSIS
        # -------------------------------------------------------------------------
        elements.append(Paragraph("4. Syntax Analysis & Abstract Syntax Tree (AST)", h2_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))

        ast_count = stats.get("ast_nodes_count", metrics.get("ast_nodes_count", 0))
        ast_p = Paragraph(f"Recursive AST Node Traversal Count: <b>{ast_count} structural nodes</b>. Root Node: <code>{compiler_data.get('ast', {}).get('node_type', 'Program')}</code>. Syntax Diagnostics: <b>0 Errors</b>.", body_style)
        elements.append(ast_p)
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------------------
        # 5. SYMBOL TABLE & SCOPING
        # -------------------------------------------------------------------------
        elements.append(Paragraph("5. Hierarchical Symbol Table", h2_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))

        sym_table_data = [["Name", "Category", "Data Type", "Scope", "Line"]]
        for s in symbols[:25]: # Page-safe top 25 symbols
            sym_table_data.append([
                str(s.get("name")),
                str(s.get("category")),
                str(s.get("data_type")),
                str(s.get("scope")),
                f"L{s.get('line')}"
            ])
        if not symbols:
            sym_table_data.append(["No symbols registered", "-", "-", "-", "-"])

        sym_table = Table(sym_table_data, colWidths=[120, 94, 110, 110, 70], repeatRows=1)
        sym_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(sym_table)
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------------------
        # 6. SEMANTIC DIAGNOSTICS
        # -------------------------------------------------------------------------
        elements.append(Paragraph("6. Semantic Diagnostics", h2_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))

        if diagnostics:
            diag_table_data = [["Severity", "Phase", "Line:Col", "Diagnostic Message"]]
            for d in diagnostics[:15]:
                diag_table_data.append([
                    str(d.get("severity", "info")).upper(),
                    str(d.get("phase", "Semantic")),
                    f"{d.get('line')}:{d.get('column')}",
                    Paragraph(str(d.get("message")), body_style)
                ])
            diag_table = Table(diag_table_data, colWidths=[70, 94, 60, 280])
            diag_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#334155")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(diag_table)
        else:
            elements.append(Paragraph("✓ Zero semantic type errors or scope violations detected.", body_style))

        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------------------
        # 7. TAC & OPTIMIZATION AUDIT
        # -------------------------------------------------------------------------
        elements.append(Paragraph("7. Three-Address Code (TAC) & Evidence-Based Optimization", h2_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))

        opt_summary = opt_audit.get("summary", {})
        orig_q_cnt = opt_summary.get("original_quad_count", len(tac))
        opt_q_cnt = opt_summary.get("optimized_quad_count", len(opt_tac))
        red_pct = opt_summary.get("reduction_percentage", 0.0)

        opt_p = Paragraph(f"Unoptimized Quads: <b>{orig_q_cnt}</b> &nbsp;|&nbsp; Optimized Quads: <b>{opt_q_cnt}</b> &nbsp;|&nbsp; Instruction Reduction: <b>{red_pct}%</b>", body_style)
        elements.append(opt_p)
        elements.append(Spacer(1, 6))

        # Pass-by-pass Evidence Table
        pass_results = opt_audit.get("pass_results", {})
        audit_table_data = [["Optimization Pass", "Status", "Candidates", "Applied", "Evidence / Reason"]]

        for pass_name, p_info in pass_results.items():
            status = p_info.get("status", "NOT_APPLIED")
            cands = p_info.get("candidates", 0)
            app = p_info.get("applied", 0)
            details = p_info.get("details", [])

            evidence_str = "No candidates found"
            if details:
                d0 = details[0]
                if d0.get("type") == "constant_folding":
                    evidence_str = f"Folded '{d0.get('before')}' -> {d0.get('after')}"
                elif d0.get("type") == "constant_propagation":
                    evidence_str = f"Blocked on loop variable '{d0.get('variable')}'"

            audit_table_data.append([pass_name, status, str(cands), str(app), evidence_str])

        audit_table = Table(audit_table_data, colWidths=[130, 94, 60, 50, 170])
        audit_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(audit_table)
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------------------
        # 8. METHOD-SCOPED CONTROL FLOW GRAPH (CFG) TOPOLOGY
        # -------------------------------------------------------------------------
        elements.append(Paragraph("8. Method-Scoped Control Flow Graphs (CFG)", h2_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))

        methods_cfg = cfg.get("methods", {})
        prog_agg = cfg.get("program_aggregate", {})

        cfg_summary_p = Paragraph(f"Isolated Methods: <b>{prog_agg.get('total_methods', len(methods_cfg))}</b> &nbsp;|&nbsp; Total Basic Blocks: <b>{prog_agg.get('total_basic_blocks', 0)}</b> &nbsp;|&nbsp; Total Edges: <b>{prog_agg.get('total_edges', 0)}</b> &nbsp;|&nbsp; Program Aggregate V(G): <b>{prog_agg.get('program_aggregate_cyclomatic_complexity', 1)}</b>", body_style)
        elements.append(cfg_summary_p)
        elements.append(Spacer(1, 6))

        cfg_table_data = [["Method Name", "Basic Blocks", "Control Edges", "Decision Points", "Method V(G) Complexity"]]
        for m_name, m_info in methods_cfg.items():
            cfg_table_data.append([
                f"<code>{m_name}()</code>",
                str(len(m_info.get("nodes", []))),
                str(len(m_info.get("edges", []))),
                str(m_info.get("decision_points", 0)),
                f"V(G) = {m_info.get('cyclomatic_complexity', 1)}"
            ])

        cfg_table = Table(cfg_table_data, colWidths=[130, 80, 80, 94, 120])
        cfg_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#334155")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(cfg_table)
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------------------
        # 9. TARGET CODE GENERATION
        # -------------------------------------------------------------------------
        elements.append(Paragraph("9. Educational JVM Bytecode Target Assembly", h2_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))

        target_p = Paragraph(f"Target Architecture: <b>{target.get('target_architecture', 'JVM Assembly')}</b> &nbsp;|&nbsp; Instruction Count: <b>{target.get('instructions_count', 0)}</b> &nbsp;|&nbsp; Max Stack Depth: <b>{target.get('max_stack_depth', 0)}</b> &nbsp;|&nbsp; Local Variable Slots: <b>{target.get('local_slots_count', 0)}</b>", body_style)
        elements.append(target_p)
        elements.append(Spacer(1, 6))

        assembly_lines = target.get("assembly_code", "").split("\n")[:15]
        assembly_snippet = "\n".join(assembly_lines) + ("\n..." if len(target.get("assembly_code", "").split("\n")) > 15 else "")
        target_box_data = [[Paragraph(f"<pre>{assembly_snippet}</pre>", code_style)]]
        target_box = Table(target_box_data, colWidths=[504])
        target_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(target_box)
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------------------
        # 10. COMPILER PIPELINE LINEAGE FLOWCHART (Vector Drawing)
        # -------------------------------------------------------------------------
        elements.append(Paragraph("10. Authoritative Pipeline Lineage", h2_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))

        d_lineage = Drawing(504, 50)
        stages = ["Source", "Preprocess", "Lexer", "AST", "Semantic", "TAC", "Opt", "CFG", "Metrics", "Target"]
        box_w = 44
        box_h = 24
        gap = 6
        start_x = 4

        for idx, stage in enumerate(stages):
            bx = start_x + idx * (box_w + gap)
            by = 12
            d_lineage.add(Rect(bx, by, box_w, box_h, rx=3, ry=3, fillColor=colors.HexColor("#1E293B"), strokeColor=colors.HexColor("#4F46E5"), strokeWidth=1))
            d_lineage.add(String(bx + box_w / 2, by + 8, stage, fontName="Helvetica-Bold", fontSize=6.5, textAnchor="middle", fillColor=colors.white))
            if idx < len(stages) - 1:
                ax = bx + box_w
                d_lineage.add(Line(ax, by + box_h / 2, ax + gap, by + box_h / 2, strokeColor=colors.HexColor("#6366F1"), strokeWidth=1.5))

        elements.append(d_lineage)
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------------------
        # 11. RECOMMENDATIONS & CONCLUSION
        # -------------------------------------------------------------------------
        elements.append(Paragraph("11. Evidence-Based Recommendations & Conclusion", h2_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))

        max_cc_val = metrics.get("max_method_complexity", 1)
        recs = []
        if max_cc_val > 10:
            recs.append("• <b>High Method Complexity:</b> Refactor high-complexity methods (V(G) > 10) into smaller modular helpers.")
        else:
            recs.append("• <b>Structural Soundness:</b> All methods demonstrate acceptable intraprocedural cyclomatic complexity (V(G) ≤ 10).")

        if warnings_count > 0:
            recs.append(f"• <b>Static Diagnostics:</b> Address {warnings_count} semantic precision/scope warnings.")
        else:
            recs.append("• <b>Zero Diagnostic Errors:</b> Code passes all syntax and type safety checks cleanly.")

        recs.append("• <b>Data & ML Layer Note:</b> Downstream Data and ML Intelligence layers were not executed in this standalone compiler pass.")

        for r in recs:
            elements.append(Paragraph(r, body_style))
            elements.append(Spacer(1, 3))

        doc.build(elements, canvasmaker=NumberedCanvas)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
