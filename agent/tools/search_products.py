"""
search_products — Function Tool for the Fashion AI Agent.

Uses @function_tool from OpenAI Agents SDK.
Queries PostgreSQL via asyncpg with unaccent() for Vietnamese diacritics support.
No RAG / no vector search — keyword ILIKE + unaccent + structured filters.
"""

from typing import Optional
from agents import function_tool
from db import get_pool


@function_tool
async def search_products(
    query: str,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    gender: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 6,
) -> dict:
    """Tìm kiếm sản phẩm thời trang theo từ khóa và bộ lọc.

    Sử dụng công cụ này khi khách hàng muốn tìm sản phẩm, ví dụ:
    "tìm áo sơ mi trắng", "có quần jean nam không?", "váy đi tiệc tầm 500k".

    Args:
        query: Từ khóa tìm kiếm bằng ngôn ngữ tự nhiên (ví dụ: áo khoác, quần short).
        category: Slug danh mục sản phẩm (ví dụ: ao-so-mi, quan-jean, dam-du-tiec).
        brand: Tên thương hiệu (ví dụ: Yody, Canifa, Routine).
        gender: Giới tính — chỉ dùng MALE, FEMALE hoặc UNISEX.
        min_price: Giá tối thiểu (VND).
        max_price: Giá tối đa (VND).
        limit: Số lượng kết quả tối đa trả về, mặc định 6.
    """
    pool = await get_pool()

    # --------------- Build dynamic WHERE clause ---------------
    conditions = ['p."isActive" = true']
    params: list = []
    param_idx = 0

    if query:
        param_idx += 1
        like_param = f"%{query}%"
        # Use unaccent() for Vietnamese diacritics-insensitive search
        # unaccent('Quần') => 'Quan', so searching 'quan' will match 'Quần'
        conditions.append(
            f"("
            f"unaccent(p.name) ILIKE unaccent(${param_idx}) OR "
            f"unaccent(p.description) ILIKE unaccent(${param_idx}) OR "
            f"unaccent(p.brand) ILIKE unaccent(${param_idx}) OR "
            f"unaccent(array_to_string(p.tags, ' ')) ILIKE unaccent(${param_idx})"
            f")"
        )
        params.append(like_param)

    if category:
        param_idx += 1
        conditions.append(f"c.slug = ${param_idx}")
        params.append(category)

    if brand:
        param_idx += 1
        conditions.append(f"unaccent(p.brand) ILIKE unaccent(${param_idx})")
        params.append(f"%{brand}%")

    if gender:
        param_idx += 1
        conditions.append(f"p.gender = ${param_idx}")
        params.append(gender)

    if min_price is not None:
        param_idx += 1
        conditions.append(f"p.price >= ${param_idx}")
        params.append(min_price)

    if max_price is not None:
        param_idx += 1
        conditions.append(f"p.price <= ${param_idx}")
        params.append(max_price)

    param_idx += 1
    params.append(limit)

    where_clause = " AND ".join(conditions)

    # --------------- Main product query ---------------
    sql = f"""
        SELECT
            p.id,
            p.name,
            p.slug,
            LEFT(p.description, 150) AS description,
            p.price::float,
            p."compareAtPrice"::float AS compare_at_price,
            p.brand,
            p.material,
            p.gender,
            p.images,
            c.name  AS category_name,
            c.slug  AS category_slug
        FROM products p
        JOIN categories c ON c.id = p."categoryId"
        WHERE {where_clause}
        ORDER BY p."createdAt" DESC
        LIMIT ${param_idx}
    """

    rows = await pool.fetch(sql, *params)

    if not rows:
        return {"products": [], "total": 0, "query": query}

    # --------------- Fetch available variants for found products ---------------
    product_ids = [r["id"] for r in rows]
    variant_sql = """
        SELECT
            pv."productId"  AS product_id,
            pv.id            AS variant_id,
            pv.size,
            pv.color,
            pv."colorHex"   AS color_hex,
            pv."stockQuantity" AS stock
        FROM product_variants pv
        WHERE pv."productId" = ANY($1)
          AND pv."isAvailable" = true
          AND pv."stockQuantity" > 0
    """
    variant_rows = await pool.fetch(variant_sql, product_ids)

    # Group variants by product_id
    variants_map: dict[str, list[dict]] = {}
    for v in variant_rows:
        pid = v["product_id"]
        variants_map.setdefault(pid, []).append(dict(v))

    # --------------- Build response ---------------
    products = []
    for r in rows:
        pid = r["id"]
        pvs = variants_map.get(pid, [])
        products.append({
            "id": pid,
            "name": r["name"],
            "slug": r["slug"],
            "description": r["description"],
            "price": r["price"],
            "compare_at_price": r["compare_at_price"],
            "brand": r["brand"],
            "material": r["material"],
            "gender": r["gender"],
            "category": r["category_name"],
            "category_slug": r["category_slug"],
            "images": r["images"] or [],
            "available_colors": list({v["color"] for v in pvs}),
            "available_sizes": list({v["size"] for v in pvs}),
            "in_stock": len(pvs) > 0,
        })

    return {
        "products": products,
        "total": len(products),
        "query": query,
    }
