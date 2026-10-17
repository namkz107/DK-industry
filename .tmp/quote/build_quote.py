from __future__ import annotations

import hashlib
import os
import shutil
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor


REFERENCE = Path(r"C:\Spring2026\BÁO GIÁ THIẾT KẾ WEBSITE.docx")
OUTPUT = Path(r"C:\Autumn2026\CTDK\dk-industry\output\BAO_GIA_THIET_KE_WEBSITE_DK_INDUSTRY.docx")
EXPECTED_SHA256 = "6FFE21C3F0E356C8E85A9785E44D1317CA4DE8E47A71169E41805E32F7C873F7"

BLACK = "000000"
PEACH = "FCE4D6"
PALE = "FFF8F3"
GRID = "D9D9D9"


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=90, start=100, bottom=90, end=100) -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_table_borders(table, color=GRID, size="8") -> None:
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.first_child_found_in("w:tblBorders")
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = qn(f"w:{edge}")
        element = borders.find(tag)
        if element is None:
            element = OxmlElement(f"w:{edge}")
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def set_repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_font(run, name="Arial", size=10.5, bold=False, color=BLACK) -> None:
    run.font.name = name
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:hAnsi"), name)
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)


def set_keep_with_next(paragraph, value=True) -> None:
    paragraph.paragraph_format.keep_with_next = value


def add_field(paragraph, instruction: str) -> None:
    run = paragraph.add_run()
    fld_char = OxmlElement("w:fldChar")
    fld_char.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = instruction
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    display = OxmlElement("w:t")
    display.text = "1"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([fld_char, instr, separate, display, end])
    set_font(run, size=8.5, color="666666")


def clear_body(doc: Document) -> None:
    body = doc._element.body
    for child in list(body):
        if child.tag != qn("w:sectPr"):
            body.remove(child)


def setup_styles(doc: Document) -> None:
    normal = doc.styles["Normal"]
    normal.font.name = "Arial"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor(0, 0, 0)
    normal.paragraph_format.space_after = Pt(4)
    normal.paragraph_format.line_spacing = 1.08
    normal.paragraph_format.left_indent = Cm(0)
    normal.paragraph_format.right_indent = Cm(0)
    normal.paragraph_format.first_line_indent = Cm(0)
    normal.paragraph_format.keep_with_next = False
    normal.paragraph_format.keep_together = False

    for style_name, size, bold, before, after in (
        ("Title", 20, False, 0, 14),
        ("Heading 1", 14, False, 12, 7),
        ("Heading 2", 11.5, True, 8, 4),
    ):
        try:
            style = doc.styles[style_name]
        except KeyError:
            style = doc.styles.add_style(style_name, WD_STYLE_TYPE.PARAGRAPH)
        style.font.name = "Arial"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
        style.font.size = Pt(size)
        style.font.bold = bold
        style.font.color.rgb = RGBColor(0, 0, 0)
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.left_indent = Cm(0)
        style.paragraph_format.right_indent = Cm(0)
        style.paragraph_format.first_line_indent = Cm(0)
        style.paragraph_format.keep_with_next = True


def add_title(doc: Document, text: str) -> None:
    p = doc.add_paragraph(style="Title")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(text)
    set_font(r, size=20, bold=False)


def add_heading(doc: Document, text: str, level=1) -> None:
    p = doc.add_paragraph(style=f"Heading {level}")
    p.add_run(text)


def add_para(doc: Document, text="", bold_lead: str | None = None, align=None, after=4) -> None:
    p = doc.add_paragraph()
    if align is not None:
        p.alignment = align
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.left_indent = Cm(0)
    p.paragraph_format.right_indent = Cm(0)
    p.paragraph_format.first_line_indent = Cm(0)
    if bold_lead and text.startswith(bold_lead):
        r1 = p.add_run(bold_lead)
        set_font(r1, bold=True)
        r2 = p.add_run(text[len(bold_lead):])
        set_font(r2)
    else:
        r = p.add_run(text)
        set_font(r)


def add_bullets(doc: Document, items: list[str], level=0) -> None:
    for item in items:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.65 + level * 0.45)
        p.paragraph_format.first_line_indent = Cm(-0.35)
        p.paragraph_format.space_after = Pt(2.5)
        r = p.add_run("•  " + item)
        set_font(r)


def add_table(doc: Document, headers: list[str], rows: list[list[str]], widths_cm: list[float], font_size=9.4):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    for i, width in enumerate(widths_cm):
        table.columns[i].width = Cm(width)
    set_table_borders(table)
    hdr = table.rows[0]
    set_repeat_table_header(hdr)
    for i, value in enumerate(headers):
        cell = hdr.cells[i]
        cell.width = Cm(widths_cm[i])
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        set_cell_shading(cell, PEACH)
        set_cell_margins(cell)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.left_indent = Cm(0)
        p.paragraph_format.right_indent = Cm(0)
        p.paragraph_format.first_line_indent = Cm(0)
        p.paragraph_format.keep_with_next = False
        p.paragraph_format.keep_together = False
        r = p.add_run(value)
        set_font(r, size=font_size, bold=True)
    for row_index, values in enumerate(rows):
        row = table.add_row()
        for i, value in enumerate(values):
            cell = row.cells[i]
            cell.width = Cm(widths_cm[i])
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_margins(cell)
            if row_index % 2 == 1:
                set_cell_shading(cell, PALE)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.03
            p.paragraph_format.left_indent = Cm(0)
            p.paragraph_format.right_indent = Cm(0)
            p.paragraph_format.first_line_indent = Cm(0)
            p.paragraph_format.keep_with_next = False
            p.paragraph_format.keep_together = False
            if i == len(values) - 1 and ("đ" in value or "triệu" in value or value.startswith("Từ")):
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            elif len(value) < 18 and i > 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(value)
            set_font(r, size=font_size, bold=value.startswith("TỔNG") or value.startswith("KHUYẾN NGHỊ"))
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def add_total(doc: Document, text: str) -> None:
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.6)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(7)
    set_keep_with_next(p)
    r = p.add_run("⇒  " + text)
    set_font(r, size=11.5, bold=True)


def add_page_break(doc: Document) -> None:
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)


def build() -> None:
    digest = hashlib.sha256(REFERENCE.read_bytes()).hexdigest().upper()
    if digest != EXPECTED_SHA256:
        raise RuntimeError(f"Reference changed: {digest}")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(REFERENCE, OUTPUT)
    doc = Document(OUTPUT)
    clear_body(doc)
    setup_styles(doc)

    section = doc.sections[0]
    section.top_margin = Inches(0.55)
    section.bottom_margin = Inches(0.58)
    section.left_margin = Inches(0.58)
    section.right_margin = Inches(0.55)
    section.header_distance = Inches(0.25)
    section.footer_distance = Inches(0.28)

    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fp.paragraph_format.space_before = Pt(2)
    fr = fp.add_run("Báo giá thiết kế website  |  17/10/2026  |  Trang ")
    set_font(fr, size=8.5, color="666666")
    add_field(fp, "PAGE")
    fr2 = fp.add_run(" / ")
    set_font(fr2, size=8.5, color="666666")
    add_field(fp, "NUMPAGES")

    add_title(doc, "BÁO GIÁ THIẾT KẾ WEBSITE DOANH NGHIỆP")
    add_para(doc, "Khung báo giá 3 mức và đề xuất áp dụng cho website DK Industry", align=WD_ALIGN_PARAGRAPH.CENTER, after=2)
    add_para(doc, "Ngày lập: 17/10/2026   |   Hiệu lực báo giá: 15 ngày", align=WD_ALIGN_PARAGRAPH.CENTER, after=12)

    add_heading(doc, "1  TỔNG QUAN BÁO GIÁ", 1)
    add_para(doc, "Tài liệu này dùng được như một khung báo giá chung cho website doanh nghiệp, đồng thời quy đổi thành phạm vi cụ thể cho DK Industry. Mức giá cuối cùng được chốt sau khi thống nhất số trang, dữ liệu cần nhập, luồng nghiệp vụ, tích hợp ngoài hệ thống và tiêu chí nghiệm thu.")
    add_para(doc, "Kết luận đề xuất: ", bold_lead="Kết luận đề xuất: ")
    add_para(doc, "Nếu chỉ triển khai website giới thiệu và form nhận yêu cầu, ngân sách 8–12 triệu là phù hợp. Khi có tài khoản khách hàng, đơn hàng hoặc yêu cầu gia công có file đính kèm, nên chọn mức 12–18 triệu. Phạm vi đầy đủ của DK Industry gồm Customer, Staff, Admin và các luồng báo giá vận hành thuộc nhóm trên 20 triệu.")

    add_heading(doc, "2  PHẠM VI WEBSITE DK INDUSTRY", 1)
    add_bullets(doc, [
        "Khu vực công khai: trang chủ, giới thiệu, dịch vụ, dự án, sản phẩm, liên hệ và chính sách.",
        "Tiếp nhận khách hàng tiềm năng và yêu cầu tư vấn hoặc báo giá từ website.",
        "Tài khoản Customer: hồ sơ, địa chỉ, giỏ hàng, đơn hàng, yêu cầu gia công, tải file kỹ thuật và theo dõi trạng thái.",
        "Khu vực Staff: xử lý lead, yêu cầu dịch vụ, báo giá theo phiên bản, đơn hàng và trao đổi với khách.",
        "Khu vực Admin: người dùng, nội dung, báo cáo tổng quan, quyền truy cập, nhật ký và thiết lập vận hành.",
        "Hệ thống responsive, phân quyền, bảo mật phiên đăng nhập, SEO cơ bản và cấu hình triển khai production.",
    ])

    add_heading(doc, "3  SO SÁNH BA MỨC ĐẦU TƯ", 1)
    add_table(doc,
        ["Gói", "Ngân sách", "Phù hợp", "Phạm vi chính", "Tiến độ"],
        [
            ["Gói 1", "8–12 triệu", "Website giới thiệu", "Trang công khai, nội dung, form liên hệ, quản trị cơ bản", "10–15 ngày"],
            ["Gói 2", "12–18 triệu", "Website có nghiệp vụ", "Gói 1 + tài khoản khách, sản phẩm, đơn hàng hoặc RFQ", "15–25 ngày"],
            ["Gói 3", "Trên 20 triệu", "Cổng vận hành", "Customer + Staff + Admin, workflow, báo giá, tích hợp", "25–45+ ngày"],
        ],
        [2.0, 2.7, 3.3, 8.0, 2.7],
        font_size=8.8,
    )
    add_para(doc, "Đơn giá chưa bao gồm VAT, tên miền, máy chủ, email doanh nghiệp, phí SMS, phí cổng thanh toán, phí bản đồ hoặc dịch vụ bên thứ ba.", after=0)

    add_page_break(doc)
    add_heading(doc, "I  GÓI 1  WEBSITE GIỚI THIỆU", 1)
    add_para(doc, "Ngân sách 8–12 triệu đồng")
    add_para(doc, "Phù hợp với doanh nghiệp cần hiện diện chuyên nghiệp, giới thiệu năng lực, sản phẩm và dự án; nhận liên hệ hoặc yêu cầu báo giá nhưng chưa cần xử lý đơn hàng và phân quyền vận hành phức tạp.")
    add_table(doc,
        ["Hạng mục", "Nội dung", "Chi phí tham chiếu"],
        [
            ["Khảo sát và cấu trúc", "Xác định mục tiêu, sitemap, nội dung cần chuẩn bị và luồng CTA", "1–1,5 triệu"],
            ["Thiết kế giao diện", "Thiết kế theo nhận diện; responsive cho mobile, tablet và desktop; tối đa 2 vòng chỉnh sửa", "2–3 triệu"],
            ["Lập trình website", "Tối đa 7 nhóm trang công khai: trang chủ, giới thiệu, dịch vụ, dự án, sản phẩm, liên hệ, chính sách", "4–5,5 triệu"],
            ["Form và CTA", "Form liên hệ hoặc yêu cầu báo giá; nút gọi điện, email, Zalo; chống spam cơ bản", "0,8–1,2 triệu"],
            ["Quản trị nội dung", "Thêm, sửa, ẩn nội dung dịch vụ, dự án và sản phẩm ở mức cơ bản", "1–1,5 triệu"],
            ["SEO và bàn giao", "Metadata, sitemap, robots, tối ưu tải trang cơ bản, triển khai và hướng dẫn sử dụng", "Đã bao gồm"],
        ],
        [4.1, 10.8, 4.0],
    )
    add_total(doc, "TỔNG NGÂN SÁCH DỰ KIẾN: 8.000.000đ – 12.000.000đ")
    add_heading(doc, "Phạm vi áp dụng cho DK Industry", 2)
    add_bullets(doc, [
        "Giữ khu vực công khai gồm giới thiệu năng lực, dịch vụ cơ khí, dự án và danh mục sản phẩm.",
        "Khách gửi form tư vấn hoặc yêu cầu báo giá; thông tin được lưu và gửi thông báo cho đơn vị phụ trách.",
        "Admin cập nhật nội dung chính; chưa có tài khoản Customer, giỏ hàng, đơn hàng hoặc workspace Staff.",
    ])
    add_heading(doc, "Không bao gồm trong Gói 1", 2)
    add_bullets(doc, [
        "Đăng nhập, hồ sơ khách hàng, lưu nhiều địa chỉ hoặc quản lý phiên đăng nhập.",
        "Giỏ hàng, đơn hàng, thanh toán, tải bản vẽ kỹ thuật hoặc theo dõi tiến độ.",
        "Dashboard Staff, phân công hồ sơ, lập báo giá theo phiên bản và lịch sử xử lý.",
    ])

    add_page_break(doc)
    add_heading(doc, "II  GÓI 2  WEBSITE DOANH NGHIỆP CÓ NGHIỆP VỤ", 1)
    add_para(doc, "Ngân sách 12–18 triệu đồng")
    add_para(doc, "Phù hợp khi website không chỉ giới thiệu mà còn cần một luồng giao dịch chính. Khách hàng có thể tạo tài khoản, gửi hồ sơ, đặt hàng hoặc theo dõi yêu cầu; doanh nghiệp có khu vực quản trị để tiếp nhận và cập nhật trạng thái.")
    add_table(doc,
        ["Hạng mục", "Nội dung", "Chi phí tham chiếu"],
        [
            ["Thiết kế và design system", "Giao diện thương hiệu, bộ thành phần dùng chung, responsive và trạng thái lỗi hoặc trống", "3–4 triệu"],
            ["Website công khai và CMS", "Trang giới thiệu, dịch vụ, dự án, sản phẩm, liên hệ; quản trị nội dung", "4–5 triệu"],
            ["Tài khoản khách hàng", "Đăng ký, đăng nhập, quên mật khẩu, hồ sơ cá nhân và địa chỉ", "2–3 triệu"],
            ["Một luồng nghiệp vụ chính", "Chọn một trong hai: giỏ hàng và đơn hàng; hoặc yêu cầu gia công và báo giá có file đính kèm", "3–4 triệu"],
            ["Quản trị và trạng thái", "Danh sách hồ sơ, tìm kiếm, cập nhật trạng thái, ghi chú và thông báo cơ bản", "2–3 triệu"],
            ["Kiểm thử và triển khai", "Phân quyền, validation, rate limit cơ bản, UAT, cấu hình production và bàn giao", "1–2 triệu"],
        ],
        [4.1, 10.8, 4.0],
    )
    add_total(doc, "TỔNG NGÂN SÁCH DỰ KIẾN: 12.000.000đ – 18.000.000đ")
    add_heading(doc, "Phạm vi áp dụng cho DK Industry", 2)
    add_bullets(doc, [
        "Phương án A: website công khai + tài khoản Customer + hồ sơ, địa chỉ, giỏ hàng và đơn hàng.",
        "Phương án B: website công khai + tài khoản Customer + yêu cầu gia công, đính kèm bản vẽ và theo dõi trạng thái.",
        "Chỉ bao gồm dashboard xử lý gọn cho một nhóm nghiệp vụ; chưa bao gồm đầy đủ workspace Staff và Admin nâng cao.",
    ])
    add_para(doc, "Khuyến nghị: với doanh nghiệp cơ khí nhận bản vẽ và báo giá theo yêu cầu, nên ưu tiên Phương án B trước; giỏ hàng chỉ nên triển khai khi danh mục có giá và tồn kho đủ rõ để đặt trực tuyến.", bold_lead="Khuyến nghị: ")

    add_page_break(doc)
    add_heading(doc, "III  GÓI 3  CỔNG KHÁCH HÀNG VÀ VẬN HÀNH", 1)
    add_para(doc, "Ngân sách từ 20 triệu đồng")
    add_para(doc, "Phù hợp với hệ thống có nhiều vai trò, dữ liệu nghiệp vụ và quy trình xử lý liên tục. Giá được chốt theo module vì số trạng thái, quyền hạn, tích hợp, dữ liệu cũ và yêu cầu bảo mật ảnh hưởng trực tiếp đến khối lượng triển khai.")
    add_table(doc,
        ["Nhóm module", "Phạm vi", "Chi phí tham chiếu"],
        [
            ["Kiến trúc và bảo mật", "Đặc tả workflow, mô hình dữ liệu, phân quyền Customer, Staff, Admin, xác thực và nhật ký", "4–6 triệu"],
            ["Website và Customer Portal", "Nội dung công khai, hồ sơ, địa chỉ, sản phẩm, giỏ hàng, đơn hàng, yêu cầu gia công và file kỹ thuật", "6–9 triệu"],
            ["Backend nghiệp vụ", "API, trạng thái đơn hàng và yêu cầu, báo giá theo phiên bản, thông báo và bảo vệ dữ liệu", "7–10 triệu"],
            ["Workspace Staff", "Dashboard, tiếp nhận và phân công, trao đổi, ghi chú nội bộ, báo giá và xử lý đơn hàng", "5–8 triệu"],
            ["Admin và kiểm soát", "Người dùng, nội dung, quyền riêng tư, audit, báo cáo tổng quan và cấu hình vận hành", "4–6 triệu"],
            ["Realtime và tích hợp", "Chat hoặc cập nhật realtime, email, lưu trữ file, bản đồ, Cloudinary hoặc dịch vụ ngoài hệ thống", "3–6 triệu"],
        ],
        [4.1, 10.8, 4.0],
    )
    add_total(doc, "TỔNG GIÁ KHỞI ĐIỂM: TRÊN 20.000.000đ  |  PHẠM VI ĐẦY ĐỦ THƯỜNG 25–35 TRIỆU")
    add_heading(doc, "Phạm vi áp dụng cho DK Industry", 2)
    add_bullets(doc, [
        "Customer quản lý tài khoản, địa chỉ, giỏ hàng, đơn hàng và yêu cầu gia công có file kỹ thuật riêng tư.",
        "Staff xử lý lead, hồ sơ kỹ thuật, báo giá, trao đổi, đơn hàng và cập nhật trạng thái theo quyền.",
        "Admin quản lý tài khoản, nội dung, dự án, sản phẩm, dịch vụ, audit và chính sách dữ liệu.",
        "Hệ thống có cơ chế bảo vệ API, tách dữ liệu theo chủ sở hữu, quản lý phiên đăng nhập và cấu hình triển khai production.",
    ])
    add_para(doc, "Gói này phù hợp nhất với phạm vi mã nguồn hiện tại của DK Industry. Nếu ngân sách cần chia nhỏ, nên triển khai theo ba giai đoạn ở trang tiếp theo.", bold_lead="Gói này phù hợp nhất với phạm vi mã nguồn hiện tại của DK Industry. ")

    add_page_break(doc)
    add_heading(doc, "IV  ĐỀ XUẤT TRIỂN KHAI RIÊNG CHO DK INDUSTRY", 1)
    add_para(doc, "Để kiểm soát ngân sách và nghiệm thu rõ ràng, dự án nên chia theo module có thể vận hành độc lập thay vì dồn toàn bộ chức năng vào một lần bàn giao.")
    add_table(doc,
        ["Giai đoạn", "Phạm vi nghiệm thu", "Ngân sách"],
        [
            ["Giai đoạn 1", "Website công khai, dịch vụ, dự án, sản phẩm, liên hệ, lead và quản trị nội dung cơ bản", "10–12 triệu"],
            ["Giai đoạn 2", "Customer Portal: tài khoản, hồ sơ, địa chỉ, giỏ hàng, đơn hàng, yêu cầu gia công, file và trạng thái", "7–10 triệu"],
            ["Giai đoạn 3", "Staff và Admin: dashboard, phân công, trao đổi, báo giá phiên bản, vận hành đơn hàng, audit và bảo mật", "8–12 triệu"],
        ],
        [3.0, 12.5, 4.0],
    )
    add_total(doc, "NGÂN SÁCH TOÀN BỘ DỰ KIẾN: 25.000.000đ – 34.000.000đ")
    add_heading(doc, "Tiêu chí chốt mức giá trong từng khoảng", 2)
    add_bullets(doc, [
        "Số lượng mẫu trang và mức độ tùy biến giao diện so với bộ nhận diện hiện có.",
        "Số workflow, trạng thái, vai trò và quyền thao tác cần kiểm soát.",
        "Số lượng dữ liệu cần nhập hoặc chuyển từ hệ thống cũ.",
        "Yêu cầu lưu trữ file, realtime, email, bản đồ, thanh toán và tích hợp bên thứ ba.",
        "Mức kiểm thử, tài liệu, môi trường staging, giám sát và hỗ trợ sau khi go-live.",
    ])
    add_heading(doc, "Hồ sơ khách hàng cần cung cấp", 2)
    add_bullets(doc, [
        "Logo, màu thương hiệu, thông tin pháp lý, hotline, email, địa chỉ và các kênh liên hệ.",
        "Nội dung giới thiệu, danh mục dịch vụ, dự án, sản phẩm, bảng giá hoặc nguyên tắc báo giá.",
        "Ảnh, video, bản vẽ mẫu được phép công bố và quy định phân loại dữ liệu riêng tư.",
        "Người duyệt nội dung, người nghiệm thu nghiệp vụ và tài khoản dịch vụ bên thứ ba.",
    ])

    add_page_break(doc)
    add_heading(doc, "V  HẠ TẦNG VÀ CHI PHÍ VẬN HÀNH", 1)
    add_para(doc, "Các khoản dưới đây là chi phí tham chiếu, thanh toán trực tiếp cho nhà cung cấp hoặc báo lại theo hóa đơn thực tế. Mức phí có thể thay đổi theo dung lượng, lưu lượng và chính sách của nhà cung cấp.")
    add_table(doc,
        ["Hạng mục", "Khuyến nghị", "Chi phí tham chiếu"],
        [
            ["Tên miền", "Tên miền .com hoặc .vn do khách hàng đứng tên", "Theo nhà cung cấp"],
            ["VPS hoặc cloud", "2–4 vCPU, 4–8 GB RAM cho giai đoạn đầu; nâng cấp theo lưu lượng", "Khoảng 4–12 triệu/năm"],
            ["SSL", "Let's Encrypt hoặc chứng thư theo yêu cầu doanh nghiệp", "Có thể 0đ"],
            ["Cloudflare", "DNS, CDN và bảo vệ cơ bản", "Có gói miễn phí"],
            ["Email và gửi thông báo", "Email doanh nghiệp và dịch vụ gửi mail giao dịch", "Theo sản lượng"],
            ["Lưu trữ file và hình ảnh", "Private object storage hoặc dịch vụ media có kiểm soát truy cập", "Theo dung lượng"],
            ["Sao lưu và giám sát", "Backup dữ liệu, log lỗi, cảnh báo uptime và kiểm tra khôi phục", "0,5–2 triệu/tháng"],
        ],
        [4.1, 10.8, 4.0],
    )

    add_heading(doc, "VI  TIẾN ĐỘ VÀ NGHIỆM THU", 1)
    add_table(doc,
        ["Bước", "Nội dung", "Đầu ra"],
        [
            ["1  Khởi động", "Chốt phạm vi, nội dung, người duyệt và tiêu chí nghiệm thu", "Biên bản phạm vi"],
            ["2  Thiết kế", "Wireframe, giao diện chính và tối đa 2 vòng phản hồi", "Thiết kế được duyệt"],
            ["3  Phát triển", "Lập trình, nhập dữ liệu mẫu, kiểm thử nội bộ và staging", "Bản chạy thử"],
            ["4  UAT", "Khách hàng kiểm tra theo kịch bản; sửa lỗi trong phạm vi đã chốt", "Biên bản nghiệm thu"],
            ["5  Go live", "Triển khai, bàn giao source, tài khoản, hướng dẫn và backup ban đầu", "Hệ thống hoạt động"],
        ],
        [3.0, 12.0, 4.9],
    )

    add_page_break(doc)
    add_heading(doc, "VII  ĐIỀU KHOẢN THƯƠNG MẠI", 1)
    add_heading(doc, "Thanh toán", 2)
    add_bullets(doc, [
        "40% khi xác nhận phạm vi và bắt đầu triển khai.",
        "40% khi hoàn thành bản staging đủ chức năng để nghiệm thu.",
        "20% sau nghiệm thu, trước khi bàn giao đầy đủ và go-live.",
    ])
    add_heading(doc, "Bảo hành và hỗ trợ", 2)
    add_bullets(doc, [
        "Bảo hành lỗi kỹ thuật 60 ngày kể từ ngày nghiệm thu.",
        "Bảo hành áp dụng cho chức năng trong phạm vi đã chốt; không bao gồm thay đổi nghiệp vụ, nội dung mới hoặc lỗi từ dịch vụ bên thứ ba.",
        "Gói bảo trì sau bảo hành được báo riêng theo số giờ hỗ trợ, tần suất cập nhật và yêu cầu giám sát.",
    ])
    add_heading(doc, "Chưa bao gồm", 2)
    add_bullets(doc, [
        "Viết mới toàn bộ nội dung marketing, chụp ảnh, quay video hoặc thiết kế lại bộ nhận diện thương hiệu.",
        "Nhập dữ liệu số lượng lớn, làm sạch dữ liệu cũ hoặc tích hợp hệ thống kế toán, ERP, CRM ngoài phạm vi.",
        "Phí tên miền, hosting, email, SMS, cổng thanh toán, bản đồ, lưu trữ, bản quyền và các dịch vụ bên thứ ba.",
        "Thay đổi lớn về giao diện hoặc workflow sau khi bản thiết kế và phạm vi đã được duyệt.",
        "Đáp ứng chứng nhận hoặc kiểm toán chuyên ngành nếu chưa được mô tả trong yêu cầu ban đầu.",
    ])
    add_heading(doc, "Nguyên tắc thay đổi phạm vi", 2)
    add_para(doc, "Yêu cầu phát sinh được mô tả bằng văn bản, đánh giá ảnh hưởng tới chi phí và tiến độ, sau đó triển khai khi hai bên xác nhận. Các lỗi khiến chức năng đã duyệt không hoạt động đúng được sửa trong phạm vi bảo hành và không tính là yêu cầu phát sinh.")
    add_para(doc, "Báo giá này là khung ngân sách để lựa chọn phương án. Báo giá chốt sẽ kèm danh sách chức năng, dữ liệu bàn giao, tiêu chí nghiệm thu và lịch triển khai cụ thể.", bold_lead="Báo giá này là khung ngân sách để lựa chọn phương án. ", after=0)

    settings = doc.settings._element
    update_fields = settings.find(qn("w:updateFields"))
    if update_fields is None:
        update_fields = OxmlElement("w:updateFields")
        settings.append(update_fields)
    update_fields.set(qn("w:val"), "true")

    doc.core_properties.title = "Báo giá thiết kế website doanh nghiệp DK Industry"
    doc.core_properties.subject = "Khung báo giá 3 mức 8–12 triệu, 12–18 triệu và trên 20 triệu"
    doc.core_properties.keywords = "báo giá website, DK Industry, website doanh nghiệp"
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
