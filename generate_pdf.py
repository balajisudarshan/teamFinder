import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print total page count."""
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
        self.setFillColor(colors.HexColor("#64748B"))

        # Running Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 11 * inch - 36, "NBKRIST • TeamFinder Collaboration Portal — Official User Manual")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

        # Running Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 46, 8.5 * inch - 54, 46)
        
        self.drawString(54, 32, "N.B.K.R. Institute of Science & Technology (Autonomous) | SIH Student Portal")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 54, 32, page_text)
        self.restoreState()


def generate_pdf(output_filename):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    c_navy = colors.HexColor("#0F2942")
    c_blue = colors.HexColor("#1D4ED8")
    c_slate = colors.HexColor("#334155")
    c_border = colors.HexColor("#E2E8F0")
    c_amber = colors.HexColor("#B45309")
    c_amber_bg = colors.HexColor("#FFFBEB")
    c_emerald = colors.HexColor("#065F46")
    c_emerald_bg = colors.HexColor("#ECFDF5")

    # Typography Styles
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=c_navy,
        spaceBefore=14,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_slate,
        spaceAfter=5
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=body_style,
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#78350F")
    )

    tip_style = ParagraphStyle(
        'TipText',
        parent=body_style,
        fontSize=8.5,
        leading=12,
        textColor=c_emerald
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.white
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_slate
    )

    story = []

    # -------------------------------------------------------------
    # COVER / BANNER HEADER
    # -------------------------------------------------------------
    banner_data = [
        [
            Paragraph("<b>INSTITUTIONAL PORTAL GUIDE</b>", ParagraphStyle('InstSub', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#CBD5E1"))),
            Paragraph("<b>VERSION 2.0 • 2026</b>", ParagraphStyle('Ver', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#CBD5E1"), alignment=2))
        ],
        [
            Paragraph("TeamFinder Collaboration Portal", ParagraphStyle('HeadLg', fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=colors.white)),
            ""
        ],
        [
            Paragraph("Student User Manual & Smart India Hackathon (SIH) Compliance Handbook", ParagraphStyle('HeadSm', fontName='Helvetica', fontSize=9.5, leading=13, textColor=colors.HexColor("#93C5FD"))),
            ""
        ]
    ]
    banner_table = Table(banner_data, colWidths=[380, 124])
    banner_table.setStyle(TableStyle([
        ('SPAN', (0, 1), (1, 1)),
        ('SPAN', (0, 2), (1, 2)),
        ('BACKGROUND', (0, 0), (-1, -1), c_navy),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 2),
        ('TOPPADDING', (0, 2), (-1, 2), 2),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 8))

    # Meta strip
    meta_data = [
        [
            Paragraph("<b>Institute:</b> N.B.K.R. Institute of Science & Technology", table_cell),
            Paragraph("<b>Audience:</b> B.Tech Students (All Branches, 1st to 4th Yr)", table_cell),
            Paragraph("<b>Domain:</b> @nbkrist.org", table_cell)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[185, 205, 114])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('BORDER', (0, 0), (-1, -1), 0.5, c_border),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # -------------------------------------------------------------
    # 1. INTRODUCTION & PURPOSE
    # -------------------------------------------------------------
    story.append(Paragraph("1. Introduction & Institutional Purpose", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_navy, spaceBefore=2, spaceAfter=6))
    story.append(Paragraph(
        "<b>TeamFinder</b> is the official campus hackathon discovery and team formation platform developed for <b>N.B.K.R. Institute of Science & Technology (Autonomous)</b>. It replaces informal, chaotic team formation across student WhatsApp chats with a structured, verified web portal connecting student talents across all engineering branches (CSE, ECE, EEE, AI&DS, IT, MECH, and CIVIL).",
        body_style
    ))
    story.append(Paragraph(
        "Whether participating in the national <b>Smart India Hackathon (SIH)</b>, NBKRIST internal hackathons, or national innovation challenges, TeamFinder validates official academic records, enforces team quotas, and ensures SIH institutional compliance before final coordinator submission.",
        body_style
    ))

    # Feature Matrix Table
    matrix_data = [
        [Paragraph("Core Capability", table_header), Paragraph("Student Benefit", table_header), Paragraph("Institutional Rule Enforced", table_header)],
        [
            Paragraph("<b>Verified Profiles</b>", table_cell),
            Paragraph("Connect with genuine peers with verified roll numbers and branches.", table_cell),
            Paragraph("Strict institutional email check (@nbkrist.org).", table_cell)
        ],
        [
            Paragraph("<b>SIH Rule Automation</b>", table_cell),
            Paragraph("Prevents disqualification during internal college screening.", table_cell),
            Paragraph("Preset 6-member limit & mandatory female teammate.", table_cell)
        ],
        [
            Paragraph("<b>Single Team Exclusivity</b>", table_cell),
            Paragraph("Guarantees transparent commitments and prevents conflicts.", table_cell),
            Paragraph("A student can belong to ONLY one squad per hackathon.", table_cell)
        ],
        [
            Paragraph("<b>1-Click WhatsApp Sharing</b>", table_cell),
            Paragraph("Quickly share pre-formatted recruitment alerts in class groups.", table_cell),
            Paragraph("Direct hash URL deep-links immediately to the squad page.", table_cell)
        ],
        [
            Paragraph("<b>Coordinator Excel Desk</b>", table_cell),
            Paragraph("Faculty coordinators can audit squads and download lists.", table_cell),
            Paragraph("Exports full roster spreadsheets ready for SIH portal upload.", table_cell)
        ]
    ]
    t_matrix = Table(matrix_data, colWidths=[114, 200, 190])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_navy),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_matrix)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 2. STUDENT REGISTRATION & ONBOARDING
    # -------------------------------------------------------------
    story.append(Paragraph("2. Student Registration & Academic Onboarding", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_navy, spaceBefore=2, spaceAfter=6))
    story.append(Paragraph("• <b>Institutional Domain:</b> Registration strictly requires an official NBKRIST email (e.g. <code>22kb1a0542@nbkrist.org</code>). Personal emails are blocked to prevent impersonation.", bullet_style))
    story.append(Paragraph("• <b>Roll Number:</b> Enter your exact College roll number (e.g. <code>22KB1A0542</code>). This is tied directly to faculty export sheets.", bullet_style))
    story.append(Paragraph("• <b>Branch & Year:</b> Choose your department (CSE, ECE, EEE, AI&DS, IT, MECH, CIVIL) and year (1st to 4th).", bullet_style))
    story.append(Paragraph("• <b>Gender (SIH Verification):</b> Accurately specify your gender for automated SIH female teammate tracking.", bullet_style))
    story.append(Paragraph("• <b>Interactive Skill Chips:</b> Instead of guessing, click one-tap chips (e.g. <i>Web Dev, Python, IoT & Arduino, 3D CAD / SolidWorks, UI/UX & Figma, Pitching & PPT, Documentation</i>) to populate your profile.", bullet_style))

    # Callout
    callout_data = [[
        Paragraph("<b>Institutional Policy:</b> Accounts registered with invalid roll numbers or non-institutional emails will be disqualified from internal hackathon screening.", callout_style)
    ]]
    t_callout = Table(callout_data, colWidths=[504])
    t_callout.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_amber_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_amber),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_callout)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 3. DISCOVERING & BROWSING TEAMS
    # -------------------------------------------------------------
    story.append(Paragraph("3. Browsing & Discovering Hackathon Teams", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_navy, spaceBefore=2, spaceAfter=6))
    story.append(Paragraph(
        "Click <b>Browse Teams</b> (<code>#/teams</code>) to view active squads. The dashboard provides search and multi-filtering:",
        body_style
    ))
    story.append(Paragraph("• <b>Search Bar:</b> Search by team name, problem domain, or required tech skills (e.g. 'Flutter', 'IoT', 'AI').", bullet_style))
    story.append(Paragraph("• <b>Hackathon Filter:</b> Filter between SIH, NBKRIST Internal Hackathons, or Open National Events.", bullet_style))
    story.append(Paragraph("• <b>Department Filter:</b> Find squads looking for students from specific branches (e.g., software teams seeking ECE for circuits or Mech for robotics chassis).", bullet_style))
    story.append(Paragraph("• <b>SIH Female Teammate Filter:</b> A dedicated toggle lets female students instantly find squads actively seeking a female teammate to complete SIH compliance.", bullet_style))
    story.append(Paragraph("• <b>Team Cards:</b> Show roster progress bars (e.g. <i>'4 / 6 filled'</i>), leader contact card, target skills, and domain theme.", bullet_style))

    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 4. APPLYING TO JOIN A TEAM
    # -------------------------------------------------------------
    story.append(Paragraph("4. Applying to Join a Team (Pitch & Exclusivity)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_navy, spaceBefore=2, spaceAfter=6))
    story.append(Paragraph("1. Click <b>Request to Join</b> on any open squad card.", bullet_style))
    story.append(Paragraph("2. Write a brief pitch introducing your capabilities (e.g. <i>'3rd Yr ECE student skilled in Arduino firmware and sensor telemetry. Ready to build the hardware prototype.'</i>).", bullet_style))
    story.append(Paragraph("3. <b>Exclusivity Rule:</b> Once accepted, you are officially committed to that squad for that hackathon. You cannot join or lead another team for the same event.", bullet_style))
    story.append(Paragraph("4. Track your sent applications under <b>My Teams -&gt; My Sent Requests</b>.", bullet_style))

    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 5. CREATING & LEADING A TEAM
    # -------------------------------------------------------------
    story.append(Paragraph("5. Creating & Leading a Hackathon Team", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_navy, spaceBefore=2, spaceAfter=6))
    story.append(Paragraph("Navigate to <b>Create Team</b> (<code>#/create-team</code>):", body_style))
    story.append(Paragraph("• <b>Hackathon Event:</b> Select SIH or an internal competition. When SIH is selected, roster size is preset to 6 and female teammate requirement is marked mandatory.", bullet_style))
    story.append(Paragraph("• <b>Problem Domain / PS Code:</b> Enter your problem statement code or select from 1-click domain pills (<i>Smart Education, Clean Energy & EV, Healthcare, Agriculture, Cybersecurity, IoT, Robotics</i>).", bullet_style))
    story.append(Paragraph("• <b>Project Description:</b> Summarize your idea and planned approach.", bullet_style))
    story.append(Paragraph("• <b>Skills & Roles Needed:</b> Click our multi-discipline chips (<i>React, Python, IoT, 3D CAD, UI/UX, Pitching, Documentation</i>) to specify what talents you need.", bullet_style))
    story.append(Paragraph("• <b>Preferences:</b> Choose target departments and academic years, then click <b>Publish Team Listing</b>.", bullet_style))

    # Pro tip
    tip_data = [[
        Paragraph("<b>Leader Pro-Tip:</b> High-scoring SIH teams typically combine technical coders with hardware specialists and creative presenters. Use interdisciplinary skill chips to recruit a well-rounded squad.", tip_style)
    ]]
    t_tip = Table(tip_data, colWidths=[504])
    t_tip.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_emerald_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, c_emerald),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_tip)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 6. SIH COMPLIANCE RULES
    # -------------------------------------------------------------
    story.append(Paragraph("6. Smart India Hackathon (SIH) Compliance Rules", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_navy, spaceBefore=2, spaceAfter=6))
    
    sih_rules = [
        [Paragraph("Mandate", table_header), Paragraph("Official SIH Rule", table_header), Paragraph("Portal Enforcement", table_header)],
        [
            Paragraph("<b>Squad Size</b>", table_cell),
            Paragraph("Exactly 6 student members (including leader).", table_cell),
            Paragraph("Hard cap at 6. Automatically changes to 'Full' upon 6th member.", table_cell)
        ],
        [
            Paragraph("<b>Female Diversity</b>", table_cell),
            Paragraph("At least 1 female teammate is compulsory for SIH.", table_cell),
            Paragraph("Automated badge: 'SIH Female Rule Met' vs 'Female Teammate Needed'.", table_cell)
        ],
        [
            Paragraph("<b>Institutional Verification</b>", table_cell),
            Paragraph("All members must be active enrolled students of NBKRIST.", table_cell),
            Paragraph("Verified college roll number and @nbkrist.org email.", table_cell)
        ],
        [
            Paragraph("<b>Roster Exclusivity</b>", table_cell),
            Paragraph("Students cannot be on two competing rosters.", table_cell),
            Paragraph("System blocks dual registration for the same hackathon.", table_cell)
        ]
    ]
    t_sih = Table(sih_rules, colWidths=[100, 204, 200])
    t_sih.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_navy),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_sih)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 7. TEAM MANAGEMENT & APPLICATION DESK
    # -------------------------------------------------------------
    story.append(Paragraph("7. Team Management & Applications Desk", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_navy, spaceBefore=2, spaceAfter=6))
    story.append(Paragraph("Click <b>My Teams</b> in the navbar (<code>#/my-teams</code>) to manage your squad:", body_style))
    story.append(Paragraph("• <b>Teams I Lead:</b> Review applicant pitches, inspect their roll number, department, year, and skills, and click <b>Accept</b> or <b>Reject</b>.", bullet_style))
    story.append(Paragraph("• <b>Notification Badge:</b> A live counter pill (e.g. <code>2 pending</code>) alerts you in the navbar whenever applicants are waiting.", bullet_style))
    story.append(Paragraph("• <b>Member In:</b> View squads where you are an active member, complete with your teammates' verified details.", bullet_style))
    story.append(Paragraph("• <b>My Sent Requests:</b> Track whether your applications are pending, accepted, or declined.", bullet_style))

    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 8. 1-CLICK WHATSAPP & LINK SHARING
    # -------------------------------------------------------------
    story.append(Paragraph("8. 1-Click WhatsApp & Shareable Links", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_navy, spaceBefore=2, spaceAfter=6))
    story.append(Paragraph("• Click <b>Share</b> on any team card or team details page.", bullet_style))
    story.append(Paragraph("• Automatically copies the deep-link URL (<code>#/team/:id</code>) and opens WhatsApp with a pre-formatted recruitment post with team name, domain, and desired roles.", bullet_style))
    story.append(Paragraph("• When peers tap the link on WhatsApp, it opens that exact team page immediately.", bullet_style))

    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 9. FACULTY COORDINATOR DESK
    # -------------------------------------------------------------
    story.append(Paragraph("9. Faculty Coordinator Desk & Excel Export", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_navy, spaceBefore=2, spaceAfter=6))
    story.append(Paragraph("Faculty Coordinators have access to the <b>Coordinator Desk</b> (<code>#/admin</code>):", body_style))
    story.append(Paragraph("• <b>Real-time Campus Metrics:</b> Total registered teams, active recruiting spots, and SIH-ready squads.", bullet_style))
    story.append(Paragraph("• <b>Roster Verification:</b> Inspect individual student roll numbers, branches, and gender compliance.", bullet_style))
    story.append(Paragraph("• <b>Excel Export:</b> One-click generation of the official <code>.xlsx</code> spreadsheet formatted for immediate submission into the national SIH nodal portal.", bullet_style))

    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 10. FAQ & TROUBLESHOOTING
    # -------------------------------------------------------------
    story.append(Paragraph("10. Frequently Asked Questions (FAQ)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_navy, spaceBefore=2, spaceAfter=6))
    story.append(Paragraph("<b>Q: Why does sign up reject my personal Gmail?</b><br/>A: TeamFinder is exclusively for NBKRIST students. Only official <code>@nbkrist.org</code> emails are authorized to guarantee genuine academic participation.", body_style))
    story.append(Paragraph("<b>Q: What happens when our team reaches 6 members?</b><br/>A: The team status automatically switches to 'Full' and join requests are locked, preventing over-recruitment.", body_style))
    story.append(Paragraph("<b>Q: Can a 1st-year or Core Engineering student participate?</b><br/>A: Yes! Hackathons require diverse skills including CAD/SolidWorks, circuit wiring, UI/UX design, and presentation pitching. Check the skill chips and apply to open teams.", body_style))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {output_filename}")

if __name__ == "__main__":
    out_path = sys.argv[1] if len(sys.argv) > 1 else "TeamFinder_User_Manual.pdf"
    generate_pdf(out_path)
