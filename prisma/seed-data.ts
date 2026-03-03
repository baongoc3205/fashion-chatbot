// Seed data configuration - Vietnamese fashion products
// This file defines the templates used by seed.ts to generate ~200 products

export const CATEGORIES = [
  { name: "Áo Sơ Mi", slug: "ao-so-mi", parent: "ao", gender: "UNISEX" },
  { name: "Áo Thun", slug: "ao-thun", parent: "ao", gender: "UNISEX" },
  { name: "Áo Polo", slug: "ao-polo", parent: "ao", gender: "MALE" },
  { name: "Áo Khoác", slug: "ao-khoac", parent: "ao", gender: "UNISEX" },
  { name: "Hoodie", slug: "hoodie", parent: "ao", gender: "UNISEX" },
  { name: "Quần Jean", slug: "quan-jean", parent: "quan", gender: "UNISEX" },
  { name: "Quần Kaki", slug: "quan-kaki", parent: "quan", gender: "MALE" },
  { name: "Quần Short", slug: "quan-short", parent: "quan", gender: "UNISEX" },
  { name: "Quần Jogger", slug: "quan-jogger", parent: "quan", gender: "UNISEX" },
  { name: "Đầm Dự Tiệc", slug: "dam-du-tiec", parent: "vay-dam", gender: "FEMALE" },
  { name: "Váy Công Sở", slug: "vay-cong-so", parent: "vay-dam", gender: "FEMALE" },
  { name: "Váy Casual", slug: "vay-casual", parent: "vay-dam", gender: "FEMALE" },
  { name: "Túi Xách", slug: "tui-xach", parent: "phu-kien", gender: "FEMALE" },
  { name: "Thắt Lưng", slug: "that-lung", parent: "phu-kien", gender: "UNISEX" },
  { name: "Sneaker", slug: "sneaker", parent: "giay-dep", gender: "UNISEX" },
  { name: "Sandal", slug: "sandal", parent: "giay-dep", gender: "UNISEX" },
  { name: "Giày Tây", slug: "giay-tay", parent: "giay-dep", gender: "MALE" },
];

export const PARENT_CATEGORIES = [
  { name: "Áo", slug: "ao" },
  { name: "Quần", slug: "quan" },
  { name: "Váy/Đầm", slug: "vay-dam" },
  { name: "Phụ Kiện", slug: "phu-kien" },
  { name: "Giày Dép", slug: "giay-dep" },
];

export const BRANDS = [
  "Yody", "Routine", "Canifa", "Elise", "IVY moda",
  "Nem", "Owen", "Aristino", "Foci", "Juno",
];

export const COLORS = [
  { name: "Trắng", hex: "#FFFFFF" },
  { name: "Đen", hex: "#000000" },
  { name: "Xanh navy", hex: "#1B2A4A" },
  { name: "Xám", hex: "#808080" },
  { name: "Be", hex: "#F5F5DC" },
  { name: "Hồng", hex: "#FFB6C1" },
  { name: "Đỏ", hex: "#DC143C" },
  { name: "Xanh rêu", hex: "#556B2F" },
  { name: "Nâu", hex: "#8B4513" },
  { name: "Xanh dương", hex: "#4169E1" },
];

export const SIZES_MAP: Record<string, string[]> = {
  ao: ["XS", "S", "M", "L", "XL", "XXL"],
  quan: ["28", "29", "30", "31", "32", "33", "34"],
  "vay-dam": ["XS", "S", "M", "L", "XL"],
  "phu-kien": ["Free Size"],
  "giay-dep": ["38", "39", "40", "41", "42", "43"],
};

export const MATERIALS: Record<string, string[]> = {
  "ao-so-mi": ["Cotton 100%", "Cotton pha Polyester", "Linen", "Vải Oxford"],
  "ao-thun": ["Cotton 100%", "Cotton Compact", "Thun lạnh"],
  "ao-polo": ["Cotton Pique", "Cotton CVC", "Coolmax"],
  "ao-khoac": ["Kaki", "Dù chống nước", "Da PU", "Nỉ"],
  hoodie: ["Nỉ bông", "French Terry", "Cotton Fleece"],
  "quan-jean": ["Denim co giãn", "Denim 100% cotton", "Denim mỏng"],
  "quan-kaki": ["Kaki co giãn", "Kaki cotton", "Kaki pha"],
  "quan-short": ["Kaki", "Thun", "Denim"],
  "quan-jogger": ["Nỉ", "Thun co giãn", "Kaki mỏng"],
  "dam-du-tiec": ["Lụa", "Ren", "Voan", "Nhung"],
  "vay-cong-so": ["Tuyết mưa", "Kate", "Đũi"],
  "vay-casual": ["Cotton", "Linen", "Vải hoa"],
  "tui-xach": ["Da thật", "Da PU", "Vải canvas"],
  "that-lung": ["Da bò thật", "Da PU", "Vải"],
  sneaker: ["Vải canvas", "Da tổng hợp", "Mesh"],
  sandal: ["Da", "Cao su", "EVA"],
  "giay-tay": ["Da bò thật", "Da bóng", "Da lộn"],
};

// Product name templates per category
export const PRODUCT_TEMPLATES: Record<string, string[]> = {
  "ao-so-mi": [
    "Áo Sơ Mi Dài Tay Oxford", "Áo Sơ Mi Slim Fit", "Áo Sơ Mi Cổ Trụ",
    "Áo Sơ Mi Tay Ngắn Linen", "Áo Sơ Mi Họa Tiết Kẻ Sọc",
    "Áo Sơ Mi Oversize", "Áo Sơ Mi Công Sở Premium",
    "Áo Sơ Mi Cổ Đức", "Áo Sơ Mi Flannel", "Áo Sơ Mi Trơn Basic",
    "Áo Sơ Mi Cuban Collar", "Áo Sơ Mi Caro Nhỏ",
  ],
  "ao-thun": [
    "Áo Thun Cổ Tròn Basic", "Áo Thun Oversize Graphic", "Áo Thun Polo Sport",
    "Áo Thun Dài Tay", "Áo Thun Crop Top", "Áo Thun In Hình",
    "Áo Thun Cổ V", "Áo Thun Raglan", "Áo Thun Henley",
    "Áo Thun Stripe", "Áo Thun Cotton Compact", "Áo Thun Unisex",
  ],
  "ao-polo": [
    "Áo Polo Classic", "Áo Polo Sport Dry-Fit", "Áo Polo Slim Fit",
    "Áo Polo Kẻ Sọc", "Áo Polo Phối Màu", "Áo Polo Coolmax",
    "Áo Polo Dài Tay", "Áo Polo Pique Premium", "Áo Polo Công Sở",
    "Áo Polo Active", "Áo Polo Trendy", "Áo Polo Oversized",
  ],
  "ao-khoac": [
    "Áo Khoác Bomber", "Áo Khoác Dù Chống Nước", "Áo Khoác Jean",
    "Áo Khoác Da", "Áo Khoác Blazer", "Áo Khoác Gió Nhẹ",
    "Áo Khoác Cardigan", "Áo Khoác Parka", "Áo Khoác Varsity",
    "Áo Khoác Coach", "Áo Khoác Nỉ Zip", "Áo Khoác Track",
  ],
  hoodie: [
    "Hoodie Zip Basic", "Hoodie Oversize", "Hoodie Graphic Art",
    "Hoodie Nỉ Bông Dày", "Hoodie Crop", "Hoodie Pullover",
    "Hoodie Tie-Dye", "Hoodie Streetwear", "Hoodie Form Rộng",
    "Hoodie Trendy Logo", "Hoodie Phối Màu", "Hoodie French Terry",
  ],
  "quan-jean": [
    "Quần Jean Slim Fit", "Quần Jean Skinny", "Quần Jean Straight",
    "Quần Jean Baggy", "Quần Jean Rách Gối", "Quần Jean Ống Rộng",
    "Quần Jean Co Giãn", "Quần Jean Wash Nhẹ", "Quần Jean Đen Trơn",
    "Quần Jean Boyfriend", "Quần Jean Cargo", "Quần Jean Mom",
  ],
  "quan-kaki": [
    "Quần Kaki Slim Fit", "Quần Kaki Công Sở", "Quần Kaki Co Giãn",
    "Quần Kaki Chino", "Quần Kaki Ống Đứng", "Quần Kaki Tapered",
    "Quần Kaki Basic", "Quần Kaki Premium", "Quần Kaki Mỏng Nhẹ",
    "Quần Kaki Đai Chun", "Quần Kaki Cargo", "Quần Kaki Dáng Suông",
  ],
  "quan-short": [
    "Quần Short Kaki", "Quần Short Jean", "Quần Short Thể Thao",
    "Quần Short Linen", "Quần Short Cargo", "Quần Short Basic",
    "Quần Short Đùi", "Quần Short Running", "Quần Short Bermuda",
    "Quần Short Jogger", "Quần Short Phối Sọc", "Quần Short Co Giãn",
  ],
  "quan-jogger": [
    "Quần Jogger Nỉ", "Quần Jogger Tech", "Quần Jogger Kaki",
    "Quần Jogger Thun", "Quần Jogger Cargo", "Quần Jogger Slim",
    "Quần Jogger Oversize", "Quần Jogger Track", "Quần Jogger Basic",
    "Quần Jogger French Terry", "Quần Jogger Zip", "Quần Jogger Sport",
  ],
  "dam-du-tiec": [
    "Đầm Dạ Hội Lụa", "Đầm Cocktail Ren", "Đầm Sequin Lấp Lánh",
    "Đầm Maxi Voan", "Đầm Bodycon", "Đầm Wrap Sang Trọng",
    "Đầm A-Line", "Đầm Đuôi Cá", "Đầm Off-Shoulder",
    "Đầm Xòe Nhung", "Đầm Hai Dây", "Đầm Lệch Vai",
  ],
  "vay-cong-so": [
    "Váy Bút Chì", "Váy Chữ A Công Sở", "Váy Midi Thanh Lịch",
    "Váy Xếp Li", "Váy Ôm Body", "Váy Suông Kết Hợp Belt",
    "Váy Vest", "Váy Liền Thân", "Váy Cổ Sơ Mi",
    "Váy Dáng Suông", "Váy Phối Nút", "Váy Tay Lỡ",
  ],
  "vay-casual": [
    "Váy Hoa Nhí", "Váy Babydoll", "Váy Denim", "Váy Linen Xòe",
    "Váy Thun Dáng Suông", "Váy Caro", "Váy Sơ Mi Dài",
    "Váy Tank Dress", "Váy Jean Yếm", "Váy Cotton Thoáng Mát",
    "Váy Kẻ Sọc", "Váy Two-Piece",
  ],
  "tui-xach": [
    "Túi Tote Da", "Túi Đeo Chéo Mini", "Túi Bucket",
    "Túi Clutch Dạ Tiệc", "Túi Hobo", "Túi Saddle",
    "Balo Thời Trang", "Túi Canvas", "Túi Xách Tay Premium",
    "Túi Baguette", "Túi Phone Bag", "Túi Shopper",
  ],
  "that-lung": [
    "Thắt Lưng Da Bò Khóa Kim", "Thắt Lưng Da Khóa Tự Động",
    "Thắt Lưng Reversible", "Thắt Lưng Braided",
    "Thắt Lưng Canvas", "Thắt Lưng Dress",
  ],
  sneaker: [
    "Giày Sneaker Low-Top", "Giày Sneaker High-Top", "Giày Sneaker Canvas",
    "Giày Sneaker Chunky", "Giày Sneaker Slip-On", "Giày Sneaker Retro",
    "Giày Sneaker Running", "Giày Sneaker Platform", "Giày Sneaker Minimalist",
    "Giày Sneaker All White", "Giày Sneaker Phối Màu", "Giày Sneaker Leather",
  ],
  sandal: [
    "Sandal Quai Ngang", "Sandal Đế Bệt", "Sandal Đế Xuồng",
    "Sandal Sport", "Sandal Dây Mảnh", "Sandal Platform",
    "Dép Birkenstock", "Sandal Gladiator", "Sandal Cao Gót",
    "Sandal Xỏ Ngón", "Sandal Quai Chéo", "Sandal Đế Bánh Mì",
  ],
  "giay-tay": [
    "Giày Oxford Classic", "Giày Derby", "Giày Loafer",
    "Giày Monk Strap", "Giày Chelsea Boot", "Giày Brogue",
    "Giày Tassel Loafer", "Giày Cap Toe", "Giày Penny Loafer",
    "Giày Wingtip", "Giày Moccasin", "Giày Chukka",
  ],
};

// Price ranges per parent category (VND)
export const PRICE_RANGES: Record<string, [number, number]> = {
  ao: [150000, 1200000],
  quan: [200000, 1500000],
  "vay-dam": [300000, 2500000],
  "phu-kien": [100000, 3000000],
  "giay-dep": [300000, 2000000],
};

// Policies
export const POLICIES = [
  {
    category: "doi-tra",
    title: "Chính Sách Đổi Trả",
    content: `Thời gian đổi trả: 30 ngày kể từ ngày nhận hàng.
Điều kiện: Sản phẩm còn nguyên tem, nhãn mác, chưa qua sử dụng hoặc giặt.
Sản phẩm lỗi do nhà sản xuất: Đổi miễn phí, hoàn tiền 100%.
Đổi size/màu: Miễn phí 1 lần đổi, từ lần 2 khách chịu phí ship.
Sản phẩm sale >50%: Không áp dụng đổi trả.
Quy trình: Liên hệ hotline hoặc chat → Gửi ảnh sản phẩm → Xác nhận → Gửi trả trong 3 ngày.`,
  },
  {
    category: "van-chuyen",
    title: "Chính Sách Vận Chuyển",
    content: `Phí ship nội thành HCM/HN: 20,000 VND (miễn phí đơn từ 500,000 VND).
Phí ship tỉnh: 30,000 VND (miễn phí đơn từ 700,000 VND).
Thời gian giao hàng: Nội thành 1-2 ngày, tỉnh 3-5 ngày.
Đơn vị vận chuyển: GHN, GHTK, J&T Express.
Có thể theo dõi đơn hàng qua mã vận đơn.`,
  },
  {
    category: "bao-hanh",
    title: "Chính Sách Bảo Hành",
    content: `Bảo hành 6 tháng cho lỗi do nhà sản xuất (đường chỉ, khóa kéo, nút).
Giày dép: Bảo hành keo đế 3 tháng.
Túi xách da: Bảo hành 12 tháng.
Không bảo hành: Hư hỏng do sử dụng sai cách, tai nạn, phai màu tự nhiên.`,
  },
  {
    category: "thanh-toan",
    title: "Phương Thức Thanh Toán",
    content: `Thanh toán khi nhận hàng (COD): Áp dụng toàn quốc.
Chuyển khoản ngân hàng: Vietcombank, Techcombank, MB Bank.
Ví điện tử: MoMo, ZaloPay, VNPay.
Thẻ tín dụng/ghi nợ: Visa, Mastercard.
Trả góp 0%: Áp dụng cho đơn từ 3,000,000 VND qua thẻ tín dụng.`,
  },
  {
    category: "khac",
    title: "Chính Sách Thành Viên",
    content: `Đăng ký thành viên miễn phí.
Tích điểm: 1,000 VND = 1 điểm.
100 điểm = giảm 10,000 VND cho đơn tiếp theo.
Hạng Silver (500 điểm): Giảm 5% mọi đơn hàng.
Hạng Gold (2000 điểm): Giảm 10% + free ship mọi đơn.
Sinh nhật: Voucher giảm 20% (áp dụng trong tháng sinh nhật).`,
  },
];
