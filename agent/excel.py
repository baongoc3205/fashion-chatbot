import sys
sys.stdout.reconfigure(encoding="utf-8")

import re
import time
from urllib.parse import urlparse, parse_qs

import pandas as pd
from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


BASE_URL = "https://dichvucong.gov.vn/p/home/dvc-dich-vu-cong-noi-bat.html#mainTitle"
BASE_DOMAIN = "https://dichvucong.gov.vn"
LIST_LINK_HINT = "dvc-chi-tiet-thu-tuc-hanh-chinh.html"
DETAIL_LINK_HINT = "dvc-tthc-thu-tuc-hanh-chinh-chi-tiet.html"

TABS = ["Công dân", "Doanh nghiệp"]
OUTPUT_FILE = "dvc_noi_bat_cong_dan_doanh_nghiep.xlsx"


# =========================
# COMMON
# =========================
def clean_text(text: str) -> str:
    if text is None:
        return ""
    return re.sub(r"\s+", " ", str(text)).strip()


def clean_text_keep_newlines(text: str) -> str:
    if text is None:
        return ""
    text = str(text).replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_ma_thu_tuc(url: str) -> str:
    try:
        qs = parse_qs(urlparse(url).query)
        return qs.get("ma_thu_tuc", [""])[0] or qs.get("maThuTuc", [""])[0]
    except Exception:
        return ""


def make_driver():
    opt = Options()
    opt.add_argument("--headless=new")
    opt.add_argument("--disable-gpu")
    opt.add_argument("--no-sandbox")
    opt.add_argument("--disable-dev-shm-usage")
    opt.add_argument("--window-size=1600,2200")
    opt.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    )
    return webdriver.Chrome(options=opt)


def wait_body(driver, timeout=20):
    WebDriverWait(driver, timeout).until(EC.presence_of_element_located((By.TAG_NAME, "body")))


def scroll_to_bottom(driver, rounds=4, pause=0.8):
    for _ in range(rounds):
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(pause)


def click_first_visible(driver, xpaths):
    for xp in xpaths:
        elems = driver.find_elements(By.XPATH, xp)
        for el in elems:
            try:
                if el.is_displayed():
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", el)
                    time.sleep(0.2)
                    try:
                        el.click()
                    except Exception:
                        driver.execute_script("arguments[0].click();", el)
                    time.sleep(0.8)
                    return True
            except Exception:
                continue
    return False


# =========================
# LIST TAB
# =========================
def click_tab(driver, tab_name: str):
    xpaths = [
        f"//a[normalize-space()='{tab_name}']",
        f"//button[normalize-space()='{tab_name}']",
        f"//*[self::a or self::button or self::span or self::div][normalize-space()='{tab_name}']",
    ]
    if not click_first_visible(driver, xpaths):
        raise RuntimeError(f"Không tìm thấy tab: {tab_name}")
    time.sleep(1.5)


def click_next_page_if_any(driver):
    xpaths = [
        "//a[contains(normalize-space(.), 'Tiếp')]",
        "//button[contains(normalize-space(.), 'Tiếp')]",
        "//a[contains(normalize-space(.), 'Sau')]",
        "//button[contains(normalize-space(.), 'Sau')]",
        "//a[normalize-space(.)='>' or normalize-space(.)='»' or normalize-space(.)='›']",
        "//button[normalize-space(.)='>' or normalize-space(.)='»' or normalize-space(.)='›']",
        "//a[contains(normalize-space(.), 'Next')]",
        "//button[contains(normalize-space(.), 'Next')]",
    ]
    return click_first_visible(driver, xpaths)


def collect_procedure_links_from_active_tab(driver):
    """
    Lấy link trang trung gian của từng thủ tục trong tab hiện tại.
    """
    links = {}

    # FIX: cuộn vài vòng để lấy hết item nếu trang có lazy-load
    for _ in range(6):
        anchors = driver.find_elements(By.XPATH, f"//a[contains(@href, '{LIST_LINK_HINT}')]")
        for a in anchors:
            try:
                if not a.is_displayed():
                    continue

                href = (a.get_attribute("href") or "").strip()
                title = clean_text(a.get_attribute("innerText") or a.text)

                if not href or LIST_LINK_HINT not in href:
                    continue
                if len(title) < 10:
                    continue

                links[href] = title
            except Exception:
                continue

        scrolled = click_next_page_if_any(driver)
        if scrolled:
            time.sleep(1.2)
            continue

        scroll_to_bottom(driver, rounds=1, pause=0.8)
        time.sleep(0.8)

    return links


# =========================
# DETAIL PAGE
# =========================
def get_xem_chi_tiet_url(driver):
    """
    Nếu nút 'Xem chi tiết' là một thẻ a có href thì lấy thẳng URL này.
    """
    xpaths = [
        f"//a[contains(@href, '{DETAIL_LINK_HINT}')]",
        "//a[contains(normalize-space(.), 'Xem chi tiết')]",
        "//button[contains(normalize-space(.), 'Xem chi tiết')]",
    ]
    for xp in xpaths:
        elems = driver.find_elements(By.XPATH, xp)
        for el in elems:
            try:
                if not el.is_displayed():
                    continue
                href = (el.get_attribute("href") or "").strip()
                if href and DETAIL_LINK_HINT in href:
                    return href
            except Exception:
                continue
    return ""


def expand_hidden_sections(driver):
    """
    FIX: mở các accordion đang bị gạt đóng trước khi lấy HTML.
    Chị đã chỉ ra 2 mục này phải click mới hiện nội dung.
    """
    labels = [
        "Cơ quan thực hiện",
        "Yêu cầu, điều kiện",
        "Yêu cầu - điều kiện",
    ]
    for label in labels:
        click_first_visible(
            driver,
            [
                f"//button[contains(normalize-space(.), '{label}')]",
                f"//a[contains(normalize-space(.), '{label}')]",
                f"//*[self::div or self::span or self::h2 or self::h3 or self::h4][contains(normalize-space(.), '{label}')]",
            ],
        )
        time.sleep(0.8)


def open_detail_page_from_intermediate(driver, intermediate_url: str):
    """
    Flow chuẩn:
    - mở trang trung gian
    - lấy/click 'Xem chi tiết'
    - mở detail thật
    - click mở các accordion ẩn
    """
    driver.get(intermediate_url)
    wait_body(driver, 20)
    time.sleep(1.0)

    # FIX: ưu tiên lấy thẳng href của "Xem chi tiết" nếu có
    xem_url = get_xem_chi_tiet_url(driver)
    if xem_url:
        driver.get(xem_url)
        wait_body(driver, 20)
        time.sleep(1.0)
    else:
        # FIX: nếu không có href thì bấm nút
        clicked = click_first_visible(
            driver,
            [
                "//a[contains(normalize-space(.), 'Xem chi tiết')]",
                "//button[contains(normalize-space(.), 'Xem chi tiết')]",
                "//*[contains(normalize-space(.), 'Xem chi tiết')]",
            ],
        )
        if clicked:
            time.sleep(1.5)
            # nếu mở tab/window mới thì chuyển sang tab mới nhất
            if len(driver.window_handles) > 1:
                driver.switch_to.window(driver.window_handles[-1])
                wait_body(driver, 20)
        else:
            # nếu không thấy nút, có thể trang đã là detail luôn
            pass

    expand_hidden_sections(driver)
    time.sleep(0.8)

    return driver.current_url, driver.page_source


def html_to_text(soup: BeautifulSoup) -> str:
    # Sao chép soup để không ảnh hưởng soup gốc
    import copy
    soup_copy = copy.copy(soup)
    
    # Xoá các vùng không phải nội dung chính (header, footer, menu, sidebar, tìm kiếm...)
    junk_selectors = [
        "header", "footer", "nav", "#header", "#footer", 
        ".sidebar", ".menu", ".breadcrumb", 
        "[role='navigation']", ".loading-all", 
        "#menu", "#navigation", ".top-bar", ".bottom-bar",
        ".lien-ket-web", ".box-search", ".tim-kiem-nhieu-nhat"
    ]
    for sel in junk_selectors:
        for el in soup_copy.select(sel):
            el.decompose()

    # Thêm code xử lý riêng cho các thẻ table thành dạng text có phân cách tab/pipe
    for table in soup_copy.find_all("table"):
        table_text = []
        for row in table.find_all("tr"):
            row_data = []
            for cell in row.find_all(["td", "th"]):
                text = clean_text(cell.get_text(" ", strip=True))
                row_data.append(text)
            if row_data:
                table_text.append(" | ".join(row_data))
        
        new_tag = soup_copy.new_tag("div")
        new_tag.string = "\n" + "\n".join(table_text) + "\n"
        table.replace_with(new_tag)

    text = soup_copy.get_text("\n", strip=True)
    
    # Remove known prefix chunks if any are left
    lines = text.splitlines()
    clean_lines = []
    skip = False
    for line in lines:
        l = line.strip()
        if not l: continue
        # Xoá các text menu hay bị sót
        if l in ["Cổng Dịch vụ công Quốc gia", "Đang xử lý...", "Đăng ký", "Đăng nhập", "Thông tin và dịch vụ", "Thủ tục hành chính", "Tra cứu TTHC", "Thủ tục hành chính liên thông", "Quyết định công bố", "Cơ quan", "Dịch vụ công trực tuyến", "Dịch vụ công nổi bật", "Tra cứu hồ sơ", "Tòa án nhân dân", "Câu hỏi thường gặp", "Thanh toán trực tuyến", "Phản ánh kiến nghị", "Gửi PAKN", "Tra cứu kết quả trả lời", "Đánh giá chất lượng phục vụ", "Hỗ trợ", "Giới thiệu", "Điều khoản sử dụng", "Hướng dẫn sử dụng", "Thông báo", "Trang chủ", "Chi tiết thủ tục"]:
            continue
        if "Tìm kiếm nhiều nhất" in l:
            skip = True
            continue
        if skip and ("Bộ Công an" in l or "Bộ Công thương" in l or "Bộ Nông nghiệp" in l or "Bộ Văn hóa" in l or "Bộ Ngoại giao" in l or "Ngân hàng Chính sách" in l):
            continue
        if skip and "Chi tiết thủ tục hành chính:" in l:
            skip = False
            continue
        clean_lines.append(line)
        
    return "\n".join(clean_lines)


def parse_labeled_sections(text: str):
    """
    Parse theo thứ tự label trên trang detail.
    """
    labels = [
        "Tên thủ tục",
        "Tên thủ tục hành chính",
        "Lĩnh vực",
        "Địa chỉ tiếp nhận",
        "Cơ quan thực hiện",
        "Cách thức thực hiện",
        "Đối tượng thực hiện",
        "Trình tự thực hiện",
        "Thời hạn giải quyết",
        "Phí",
        "Lệ phí",
        "Phí, lệ phí",
        "Thành phần hồ sơ",
        "Kết quả thực hiện",
        "Yêu cầu, điều kiện",
        "Yêu cầu - điều kiện",
        "Căn cứ pháp lý",
        "Thủ tục hành chính liên quan",
    ]

    alias = {
        "Tên thủ tục hành chính": "Tên thủ tục",
        "Yêu cầu - điều kiện": "Yêu cầu, điều kiện",
        "Phí, lệ phí": "Phí",
    }

    lines = [clean_text(x) for x in text.splitlines()]
    lines = [x for x in lines if x]

    result = {"Nội dung chi tiết": clean_text_keep_newlines(text)}

    def is_label_line(line: str):
        return any(
            line == lb
            or line.startswith(lb + " ")
            or line.startswith(lb + "\t")
            or line.startswith(lb + ":")
            or line.startswith(lb + " -")
            for lb in labels
        )

    i = 0
    while i < len(lines):
        line = lines[i]
        matched = None

        for lb in labels:
            if (
                line == lb
                or line.startswith(lb + " ")
                or line.startswith(lb + ":")
                or line.startswith(lb + " -")
            ):
                matched = lb
                break

        if not matched:
            i += 1
            continue

        key = alias.get(matched, matched)
        rest = line[len(matched):].strip(" :\t-")
        content = []
        if rest:
            content.append(rest)

        j = i + 1
        while j < len(lines) and not is_label_line(lines[j]):
            content.append(lines[j])
            j += 1

        result[key] = "\n".join(content).strip()
        i = j

    return result


def extract_title(soup: BeautifulSoup, fallback_text: str):
    selectors = [
        "h1",
        "h2",
        ".page-title",
        ".title",
        ".main-title",
        ".detail-title",
    ]
    for sel in selectors:
        node = soup.select_one(sel)
        if node:
            txt = clean_text(node.get_text(" ", strip=True))
            if txt:
                return txt

    lines = [clean_text(x) for x in fallback_text.splitlines()]
    lines = [x for x in lines if x]
    return lines[0] if lines else ""


def parse_detail_html(html: str):
    soup = BeautifulSoup(html, "html.parser")
    
    # 1. Trích xuất Text sạch không chứa menu/bảng rối
    text = html_to_text(soup)
    sections = parse_labeled_sections(text)

    # 2. Xử lý các section để lấy title

    title = extract_title(soup, text)

    return {
        "Tên thủ tục chi tiết": title or sections.get("Tên thủ tục", ""),
        "Lĩnh vực chi tiết": sections.get("Lĩnh vực", ""),
        "Địa chỉ tiếp nhận": sections.get("Địa chỉ tiếp nhận", ""),
        "Cơ quan thực hiện": sections.get("Cơ quan thực hiện", ""),
        "Cách thức thực hiện": sections.get("Cách thức thực hiện", ""),
        "Đối tượng thực hiện": sections.get("Đối tượng thực hiện", ""),
        "Trình tự thực hiện": sections.get("Trình tự thực hiện", ""),
        "Thời hạn giải quyết": sections.get("Thời hạn giải quyết", ""),
        "Phí": sections.get("Phí", ""),
        "Lệ phí": sections.get("Lệ phí", ""),
        "Thành phần hồ sơ": sections.get("Thành phần hồ sơ", ""),
        "Kết quả thực hiện": sections.get("Kết quả thực hiện", ""),
        "Yêu cầu, điều kiện": sections.get("Yêu cầu, điều kiện", ""),
        "Căn cứ pháp lý": sections.get("Căn cứ pháp lý", ""),
        "Thủ tục hành chính liên quan": sections.get("Thủ tục hành chính liên quan", ""),
        "Nội dung chi tiết": sections.get("Nội dung chi tiết", text),
    }


def crawl_tab(tab_name: str):
    driver = make_driver()
    try:
        driver.get(BASE_URL)
        wait_body(driver, 20)
        time.sleep(1.0)

        # FIX: bấm tab Công dân / Doanh nghiệp
        click_tab(driver, tab_name)

        # FIX: lấy link thủ tục của tab hiện tại
        links = collect_procedure_links_from_active_tab(driver)
        links = dict(sorted(links.items(), key=lambda x: x[1].lower()))

        print(f"[{tab_name}] số thủ tục lấy được: {len(links)}")

        rows = []
        for idx, (list_url, list_title) in enumerate(links.items(), start=1):
            print(f"[{tab_name}] {idx}/{len(links)} - {list_title[:100]}")

            try:
                final_url, html = open_detail_page_from_intermediate(driver, list_url)
                detail_data = parse_detail_html(html)
            except Exception as e:
                final_url = ""
                detail_data = {
                    "Tên thủ tục chi tiết": "",
                    "Lĩnh vực chi tiết": "",
                    "Địa chỉ tiếp nhận": "",
                    "Cơ quan thực hiện": "",
                    "Cách thức thực hiện": "",
                    "Đối tượng thực hiện": "",
                    "Trình tự thực hiện": "",
                    "Thời hạn giải quyết": "",
                    "Phí": "",
                    "Lệ phí": "",
                    "Thành phần hồ sơ": "",
                    "Kết quả thực hiện": "",
                    "Yêu cầu, điều kiện": "",
                    "Căn cứ pháp lý": "",
                    "Thủ tục hành chính liên quan": "",
                    "Nội dung chi tiết": f"ERROR: {e}",
                }

            rows.append({
                "Đối tượng": tab_name,
                "Tên thủ tục ở danh sách": list_title,
                "Link danh sách": list_url,
                "Mã thủ tục": extract_ma_thu_tuc(list_url),
                "Link chi tiết cuối": final_url,
                **detail_data,
            })

            time.sleep(0.4)

        df = pd.DataFrame(rows)

        # FIX: giữ xuống dòng cho các cột dài để Excel đọc dễ hơn
        keep_newline_cols = {
            "Cách thức thực hiện",
            "Trình tự thực hiện",
            "Thành phần hồ sơ",
            "Kết quả thực hiện",
            "Yêu cầu, điều kiện",
            "Nội dung chi tiết",
        }

        for col in df.columns:
            if col in keep_newline_cols:
                df[col] = df[col].astype(str).map(clean_text_keep_newlines)
            else:
                df[col] = df[col].astype(str).map(clean_text)

        return df

    finally:
        try:
            driver.quit()
        except Exception:
            pass


def format_sheet(writer, sheet_name, df):
    workbook = writer.book
    worksheet = writer.sheets[sheet_name]

    header_format = workbook.add_format({
        "bold": True,
        "text_wrap": True,
        "valign": "vcenter",
        "align": "center",
        "fg_color": "#4F81BD",
        "font_color": "white",
        "border": 1
    })

    cell_format = workbook.add_format({
        "text_wrap": True,
        "valign": "top",
        "border": 1
    })

    for col_num, col_name in enumerate(df.columns):
        worksheet.write(0, col_num, col_name, header_format)

        max_len = len(str(col_name))
        if len(df) > 0:
            max_len = max(max_len, df[col_name].astype(str).map(len).max())

        width = min(max_len + 2, 60)

        if col_name in ["Đối tượng", "Mã thủ tục"]:
            width = 12
        elif col_name in ["Link danh sách", "Link chi tiết cuối"]:
            width = 45
        elif col_name in ["Tên thủ tục ở danh sách", "Tên thủ tục chi tiết"]:
            width = 45
        elif col_name in ["Phí", "Lệ phí", "Thời hạn giải quyết"]:
            width = 28

        worksheet.set_column(col_num, col_num, width, cell_format)

    worksheet.freeze_panes(1, 0)
    worksheet.autofilter(0, 0, max(len(df), 1), len(df.columns) - 1)


def main():
    all_dfs = {}

    for tab in TABS:
        df = crawl_tab(tab)

        desired_order = [
            "Đối tượng",
            "Tên thủ tục ở danh sách",
            "Link danh sách",
            "Mã thủ tục",
            "Link chi tiết cuối",
            "Tên thủ tục chi tiết",
            "Lĩnh vực chi tiết",
            "Địa chỉ tiếp nhận",
            "Cơ quan thực hiện",
            "Cách thức thực hiện",
            "Đối tượng thực hiện",
            "Trình tự thực hiện",
            "Thời hạn giải quyết",
            "Phí",
            "Lệ phí",
            "Thành phần hồ sơ",
            "Kết quả thực hiện",
            "Yêu cầu, điều kiện",
            "Căn cứ pháp lý",
            "Thủ tục hành chính liên quan",
            "Nội dung chi tiết",
        ]
        for col in desired_order:
            if col not in df.columns:
                df[col] = ""
        extra_cols = [c for c in df.columns if c not in desired_order]
        df = df[desired_order + extra_cols]

        all_dfs[tab] = df

    try:
        with pd.ExcelWriter(OUTPUT_FILE, engine="xlsxwriter") as writer:
            for sheet_name, df in all_dfs.items():
                df.to_excel(writer, index=False, sheet_name=sheet_name)
                format_sheet(writer, sheet_name, df)

        print(f"Đã tạo xong: {OUTPUT_FILE}")

    except ImportError:
        print("Không tìm thấy engine 'xlsxwriter', đang xuất Excel mặc định.")
        print("Cài bằng: pip install xlsxwriter")
        with pd.ExcelWriter(OUTPUT_FILE) as writer:
            for sheet_name, df in all_dfs.items():
                df.to_excel(writer, index=False, sheet_name=sheet_name)
        print(f"Đã tạo xong: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()