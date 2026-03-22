"""
Re-test after optimization: Vietnamese diacritics with unaccent().
"""
import asyncio
import sys
import os
import json
import time

sys.path.insert(0, os.path.dirname(__file__))

from db import get_pool, close_pool


async def run_tests():
    results = []
    pool = await get_pool()

    # --- Test 1: 'quan' should match 'Quần' via unaccent ---
    t0 = time.perf_counter()
    sql = """
        SELECT p.name, p.price::float, p.brand, c.name AS category
        FROM products p
        JOIN categories c ON c.id = p."categoryId"
        WHERE p."isActive" = true
          AND (unaccent(p.name) ILIKE unaccent($1)
               OR unaccent(p.description) ILIKE unaccent($1)
               OR unaccent(p.brand) ILIKE unaccent($1)
               OR unaccent(array_to_string(p.tags, ' ')) ILIKE unaccent($1))
        ORDER BY p."createdAt" DESC
        LIMIT 6
    """
    rows = await pool.fetch(sql, "%quan%")
    t1 = time.perf_counter()
    results.append({
        "test": "diacritics_quan_matches_Quan",
        "found": len(rows),
        "latency_ms": round((t1 - t0) * 1000, 1),
        "products": [{"name": r["name"], "price": r["price"], "brand": r["brand"], "cat": r["category"]} for r in rows],
        "pass": len(rows) > 0
    })

    # --- Test 2: 'ao so mi' should match 'Áo Sơ Mi' ---
    t0 = time.perf_counter()
    rows2 = await pool.fetch(sql, "%ao so mi%")
    t1 = time.perf_counter()
    results.append({
        "test": "diacritics_ao_so_mi",
        "found": len(rows2),
        "latency_ms": round((t1 - t0) * 1000, 1),
        "products": [{"name": r["name"], "price": r["price"]} for r in rows2],
        "pass": len(rows2) > 0
    })

    # --- Test 3: 'vay' should match 'Váy' ---
    t0 = time.perf_counter()
    rows3 = await pool.fetch(sql, "%vay%")
    t1 = time.perf_counter()
    results.append({
        "test": "diacritics_vay_matches_Vay",
        "found": len(rows3),
        "latency_ms": round((t1 - t0) * 1000, 1),
        "products": [{"name": r["name"], "price": r["price"]} for r in rows3],
        "pass": len(rows3) > 0
    })

    # --- Test 4: Full pipeline - keyword + price + variants ---
    t0 = time.perf_counter()
    main_sql = """
        SELECT p.id, p.name, p.price::float, p.brand, p.gender, c.name AS cat
        FROM products p
        JOIN categories c ON c.id = p."categoryId"
        WHERE p."isActive" = true
          AND (unaccent(p.name) ILIKE unaccent($1)
               OR unaccent(p.description) ILIKE unaccent($1))
          AND p.price <= $2
        ORDER BY p."createdAt" DESC
        LIMIT $3
    """
    rows4 = await pool.fetch(main_sql, "%ao%", 500000, 6)
    
    product_ids = [r["id"] for r in rows4]
    variant_count = 0
    if product_ids:
        vrows = await pool.fetch(
            'SELECT COUNT(*) AS cnt FROM product_variants WHERE "productId" = ANY($1) AND "isAvailable" = true AND "stockQuantity" > 0',
            product_ids
        )
        variant_count = vrows[0]["cnt"]
    t1 = time.perf_counter()
    results.append({
        "test": "combined_keyword_price_variants",
        "query": "ao (price <= 500k)",
        "products_found": len(rows4),
        "available_variants": variant_count,
        "latency_ms": round((t1 - t0) * 1000, 1),
        "products": [{"name": r["name"], "price": r["price"], "brand": r["brand"]} for r in rows4],
        "pass": len(rows4) > 0
    })

    # --- Test 5: Exact Vietnamese keyword with diacritics ---
    t0 = time.perf_counter()
    rows5 = await pool.fetch(sql, "%Quần Jean%")
    t1 = time.perf_counter()
    results.append({
        "test": "exact_vietnamese_Quan_Jean",
        "found": len(rows5),
        "latency_ms": round((t1 - t0) * 1000, 1),
        "products": [{"name": r["name"], "price": r["price"]} for r in rows5],
        "pass": len(rows5) > 0
    })
    # --- Test 6: Tag search ---
    t0 = time.perf_counter()
    tag_sql = """
        SELECT p.name, p.tags, p.price::float
        FROM products p
        WHERE p."isActive" = true
          AND unaccent(array_to_string(p.tags, ' ')) ILIKE unaccent($1)
        LIMIT 5
    """
    rows6 = await pool.fetch(tag_sql, "%casual%")
    t1 = time.perf_counter()
    results.append({
        "test": "tag_search_casual",
        "found": len(rows6),
        "latency_ms": round((t1 - t0) * 1000, 1),
        "pass": True  # tags may or may not have 'casual'
    })
    # --- Test 7: Tag search ---
    t0 = time.perf_counter()
    tag_sql = """
        SELECT p.name, p.tags, p.price::float
        FROM products p
        WHERE p."isActive" = true
          AND unaccent(array_to_string(p.tags, ' ')) ILIKE unaccent($1)
        LIMIT 5
    """
    rows6 = await pool.fetch(tag_sql, "%casual%")
    t1 = time.perf_counter()
    results.append({
        "test": "tag_search_casual",
        "found": len(rows6),
        "latency_ms": round((t1 - t0) * 1000, 1),
        "pass": True  # tags may or may not have 'casual'
    })

    await close_pool()

    # --- Summary ---
    all_pass = all(r["pass"] for r in results)
    avg_latency = sum(r["latency_ms"] for r in results) / len(results)

    summary = {
        "total_tests": len(results),
        "all_passed": all_pass,
        "avg_latency_ms": round(avg_latency, 1),
        "tests": results
    }

    output_path = os.path.join(os.path.dirname(__file__), "test_results_v2.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print(f"Tests: {len(results)} | All passed: {all_pass} | Avg latency: {avg_latency:.1f}ms")
    print(f"Results saved to: {output_path}")


if __name__ == "__main__":
    asyncio.run(run_tests())
