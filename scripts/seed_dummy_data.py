#!/usr/bin/env python
"""
Generate dummy data for all Django models.

Usage (from project root):
  python scripts/seed_dummy_data.py
  python scripts/seed_dummy_data.py --users 20 --products 50 --clear
  python scripts/seed_dummy_data.py --help

Requires: pip install -r backend/requirements.txt
"""

from __future__ import annotations

import argparse
import os
import random
import sys
from io import BytesIO
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.text import slugify
from PIL import Image
from tqdm import tqdm

from app_account.models import Address
from django.core.files.base import ContentFile

from app_content.models import BlogComment, BlogPost, Course, CourseEpisode, CourseFile, Tutorial
from app_order.models import Cart, CartItem, Order, OrderItem
from app_payment.models import Wallet, WalletTransaction
from app_product.models import Category, Comment, Product, ProductImage

User = get_user_model()

# --- Persian dummy content pools ---

CATEGORY_NAMES = [
    "کیک و تارت",
    "شیرینی خشک",
    "دسر و موس",
    "شکلات و ترافل",
    "مناسبتی",
    "هدیه و بسته‌بندی",
    "رژیمی و کم‌قند",
    "نوشیدنی و دمنوش",
    "کوکی و بیسکویت",
    "بستنی خانگی",
]

PRODUCT_PREFIXES = [
    "کیک",
    "شیرینی",
    "دسر",
    "باکس",
    "ترافل",
    "کوکی",
    "رولت",
    "پای",
]

PRODUCT_SUFFIXES = [
    "شکلاتی",
    "وانیلی",
    "پسته‌ای",
    "توت‌فرنگی",
    "کاراملی",
    "دارچینی",
    "مخصوص",
    "کلاسیک",
]

BLOG_TITLES = [
    "نکات نگهداری شیرینی در منزل",
    "بسته‌بندی هدیه برای مناسبت‌ها",
    "شیرینی کم‌قند — راهنمای انتخاب",
    "تزیین ساده کیک در خانه",
    "تفاوت شیرینی تر و خشک",
    "انتخاب شیرینی برای مهمانی",
    "نگهداری کیک در یخچال",
    "ایده‌های دسر برای رمضان",
]

TUTORIAL_TITLES = [
    "پایه کیک اسفنجی",
    "روکش شکلاتی براق",
    "بسته‌بندی حرفه‌ای هدیه",
    "شیرینی کم‌قند",
    "تزیین روی کیک با خامه",
    "تهیه ترافل در خانه",
]

COURSE_TITLES = [
    "دوره جامع کیک و شیرینی خانگی",
    "تزیین حرفه‌ای کیک",
    "شیرینی‌های مناسبتی و هدیه",
    "دسر و موس — از صفر تا صد",
]

EPISODE_TITLES = [
    "معرفی دوره و ابزارها",
    "آشنایی با مواد اولیه",
    "تکنیک پایه",
    "تمرین عملی",
    "نکات حرفه‌ای",
    "جمع‌بندی و پروژه نهایی",
    "پرسش و پاسخ",
    "منابع تکمیلی",
]

DEMO_VIDEO_URL = "https://www.aparat.com/video/video/embed/videohash/sample/vt/frame"

PROVINCES = ["تهران", "اصفهان", "فارس", "خراسان رضوی", "آذربایجان شرقی"]
CITIES = ["تهران", "اصفهان", "شیراز", "مشهد", "تبریز"]


def make_image_file(name: str, rgb: tuple[int, int, int], size: tuple[int, int] = (480, 480)):
    img = Image.new("RGB", size, rgb)
    buf = BytesIO()
    img.save(buf, format="WEBP", quality=85)
    from django.core.files.base import ContentFile

    return ContentFile(buf.getvalue(), name=name)


def unique_slug(base: str, model, field: str = "slug") -> str:
    slug = slugify(base, allow_unicode=True) or "item"
    candidate = slug
    n = 1
    while model.objects.filter(**{field: candidate}).exists():
        n += 1
        candidate = f"{slug}-{n}"
    return candidate


def clear_all_data() -> None:
    print("Clearing existing data…")
    OrderItem.objects.all().delete()
    Order.objects.all().delete()
    WalletTransaction.objects.all().delete()
    Wallet.objects.all().delete()
    CartItem.objects.all().delete()
    Cart.objects.all().delete()
    Comment.objects.all().delete()
    CourseFile.objects.all().delete()
    ProductImage.objects.all().delete()
    Product.objects.all().delete()
    Category.objects.all().delete()
    BlogComment.objects.all().delete()
    BlogPost.objects.all().delete()
    CourseEpisode.objects.all().delete()
    Course.objects.all().delete()
    Tutorial.objects.all().delete()
    Address.objects.all().delete()
    User.objects.filter(is_superuser=False).delete()
    print("Done clearing.\n")


def seed_users(count: int) -> list[User]:
    users: list[User] = []
    for i in tqdm(range(count), desc="Users", unit="user"):
        username = f"user{i + 1:04d}"
        if User.objects.filter(username=username).exists():
            users.append(User.objects.get(username=username))
            continue
        phone = f"0912{1000000 + i:07d}"[-11:]
        user = User.objects.create_user(
            username=username,
            password="testpass123",
            first_name=f"کاربر",
            last_name=str(i + 1),
            phone_number=phone,
            email=f"user{i + 1}@example.com",
        )
        users.append(user)
    return users


def seed_wallets(users: list) -> None:
    for user in tqdm(users, desc="Wallets", unit="wallet"):
        wallet = Wallet.get_or_create_for_user(user)
        if wallet.balance > 0:
            continue
        amount = random.randint(50, 500) * 1000
        wallet.credit(amount, WalletTransaction.TxType.TOP_UP, description="موجودی اولیه آزمایشی")


def seed_categories(count: int) -> list[Category]:
    categories: list[Category] = []
    names = CATEGORY_NAMES[:count] if count <= len(CATEGORY_NAMES) else [
        f"{random.choice(CATEGORY_NAMES)} {i + 1}" for i in range(count)
    ]
    for i, name in enumerate(tqdm(names, desc="Categories", unit="cat")):
        slug = unique_slug(name, Category)
        cat = Category.objects.create(
            name=name,
            slug=slug,
            description=f"دسته‌بندی {name} — محصولات تازه و خانگی.",
            order=i,
            is_active=True,
        )
        categories.append(cat)
    # Optional subcategories for first two parents
    if len(categories) >= 2:
        for j, parent in enumerate(categories[:2]):
            sub_name = f"{parent.name} — ویژه"
            Category.objects.create(
                name=sub_name,
                slug=unique_slug(sub_name, Category),
                parent=parent,
                order=j,
                is_active=True,
            )
    return categories


def seed_products(count: int, categories: list[Category]) -> list[Product]:
    products: list[Product] = []
    for i in tqdm(range(count), desc="Products", unit="product"):
        title = f"{random.choice(PRODUCT_PREFIXES)} {random.choice(PRODUCT_SUFFIXES)} {i + 1}"
        slug = unique_slug(title, Product)
        price = random.randint(8, 120) * 10000
        on_sale = random.random() < 0.25
        discounted = int(price * random.uniform(0.7, 0.92)) if on_sale else None
        product = Product(
            category=random.choice(categories),
            title=title,
            en_title=f"Product {i + 1}",
            slug=slug,
            description=(
                f"{title} با مواد اولیه تازه تهیه شده است. "
                "مناسب پذیرایی و هدیه. نگهداری در جای خنک توصیه می‌شود."
            ),
            detailed_description=(
                f"جزئیات {title}\n\n"
                f"وزن تقریبی: {random.randint(200, 1500)} گرم\n"
                f"طعم: {random.choice(PRODUCT_SUFFIXES)}\n\n"
                "مواد اولیه از تامین‌کنندگان معتبر تهیه شده و در روز تولید ارسال می‌شود."
            ),
            price=price,
            discounted_price=discounted,
            stock=random.randint(0, 50),
            is_active=True,
        )
        product.save()
        products.append(product)
    return products


def seed_product_images(products: list[Product], per_product: int) -> None:
    total = len(products) * per_product
    with tqdm(total=total, desc="Product images", unit="img") as bar:
        for product in products:
            for j in range(per_product):
                color = (
                    random.randint(180, 255),
                    random.randint(140, 220),
                    random.randint(100, 180),
                )
                img_file = make_image_file(f"product-{product.pk}-{j}.webp", color)
                ProductImage.objects.create(
                    product=product,
                    image=img_file,
                    alt_text=product.title,
                    order=j,
                    is_main=(j == 0),
                )
                bar.update(1)


def seed_comments(count: int, products: list[Product], users: list[User]) -> None:
    roots: list[Comment] = []
    for _ in tqdm(range(count), desc="Product comments", unit="comment"):
        roots.append(
            Comment.objects.create(
                product=random.choice(products),
                user=random.choice(users),
                title="نظر مشتری",
                text=random.choice(
                    [
                        "خیلی خوشمزه بود، حتما دوباره سفارش می‌دهم.",
                        "بسته‌بندی عالی و ارسال سریع.",
                        "طعم عالی، پیشنهاد می‌کنم.",
                    ]
                ),
                rating=random.randint(3, 5),
                is_approved=random.random() < 0.85,
            )
        )

    reply_count = max(count // 3, 5)
    for _ in tqdm(range(reply_count), desc="Product replies", unit="reply"):
        if not roots:
            break
        parent = random.choice(roots)
        Comment.objects.create(
            product=parent.product,
            user=random.choice(users),
            parent=parent,
            text=random.choice(
                [
                    "ممنون از نظرتون!",
                    "خوشحالیم که راضی بودید.",
                    "برای سفارش بعدی تخفیف داریم.",
                ]
            ),
            rating=5,
            is_approved=True,
        )


def seed_addresses(users: list[User], per_user: int) -> list[Address]:
    addresses: list[Address] = []
    total = len(users) * per_user
    with tqdm(total=total, desc="Addresses", unit="addr") as bar:
        for user in users:
            for j in range(per_user):
                addr = Address.objects.create(
                    user=user,
                    title="خانه" if j == 0 else f"آدرس {j + 1}",
                    province=random.choice(PROVINCES),
                    city=random.choice(CITIES),
                    postal_address=f"خیابان نمونه، پلاک {random.randint(1, 200)}",
                    postal_code=f"{random.randint(1000000000, 9999999999)}",
                    receiver_name=user.get_full_name() or user.username,
                    receiver_phone=user.phone_number or "09120000000",
                    is_default=(j == 0),
                )
                addresses.append(addr)
                bar.update(1)
    return addresses


def seed_carts(users: list[User], products: list[Product], max_users: int) -> None:
    subset = random.sample(users, min(max_users, len(users)))
    for user in tqdm(subset, desc="Carts", unit="cart"):
        cart, _ = Cart.objects.get_or_create(user=user)
        for product in random.sample(products, min(3, len(products))):
            CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={"quantity": random.randint(1, 3)},
            )


def seed_orders(count: int, users: list[User], addresses: list[Address], products: list[Product]) -> None:
    if not addresses:
        return
    for _ in tqdm(range(count), desc="Orders", unit="order"):
        user = random.choice(users)
        user_addresses = [a for a in addresses if a.user_id == user.id]
        if not user_addresses:
            continue
        address = random.choice(user_addresses)
        order_products = random.sample(products, min(random.randint(1, 4), len(products)))
        total = sum(p.final_price * random.randint(1, 2) for p in order_products)
        order = Order.objects.create(
            user=user,
            address=address,
            status=random.choice(list(Order.Status.values)),
            total_price=total,
            is_paid=random.random() < 0.7,
            tracking_code=f"TRK{random.randint(100000, 999999)}",
        )
        for product in order_products:
            qty = random.randint(1, 2)
            OrderItem.objects.create(
                order=order,
                product=product,
                price=product.final_price,
                quantity=qty,
            )


def seed_blog(post_count: int, comment_count: int, users: list[User]) -> None:
    posts: list[BlogPost] = []
    titles = BLOG_TITLES[:post_count] if post_count <= len(BLOG_TITLES) else [
        f"{random.choice(BLOG_TITLES)} {i + 1}" for i in range(post_count)
    ]
    for i, title in enumerate(tqdm(titles, desc="Blog posts", unit="post")):
        slug = unique_slug(title, BlogPost)
        color = (random.randint(200, 255), random.randint(180, 240), random.randint(160, 220))
        post = BlogPost(
            title=title,
            slug=slug,
            excerpt=f"خلاصه مقاله درباره {title}.",
            body=f"<p>متن کامل مقاله: {title}.</p><p>محتوای آموزشی برای مشتریان فروشگاه.</p>",
            author=random.choice(users) if users else None,
            is_published=True,
        )
        post.thumbnail.save(f"blog-{slug}.webp", make_image_file(f"blog-{slug}.webp", color), save=False)
        post.save()
        posts.append(post)

    roots: list[BlogComment] = []
    for _ in tqdm(range(comment_count), desc="Blog comments", unit="comment"):
        if not posts:
            break
        roots.append(
            BlogComment.objects.create(
                post=random.choice(posts),
                user=random.choice(users),
                text="ممنون از مطلب مفیدتون.",
                is_approved=True,
            )
        )

    reply_count = max(comment_count // 3, 5)
    for _ in tqdm(range(reply_count), desc="Blog replies", unit="reply"):
        if not roots:
            break
        parent = random.choice(roots)
        BlogComment.objects.create(
            post=parent.post,
            user=random.choice(users),
            parent=parent,
            text=random.choice(
                [
                    "خوشحالیم که مفید بود.",
                    "سوال دیگری دارید بپرسید.",
                    "ممنون از همراهی شما.",
                ]
            ),
            is_approved=True,
        )


def unique_episode_slug(course: Course, title: str) -> str:
    slug = slugify(title, allow_unicode=True) or "episode"
    candidate = slug
    n = 1
    while CourseEpisode.objects.filter(course=course, slug=candidate).exists():
        n += 1
        candidate = f"{slug}-{n}"
    return candidate


def seed_courses(count: int, episodes_per_course: int) -> None:
    titles = COURSE_TITLES[:count] if count <= len(COURSE_TITLES) else [
        f"{random.choice(COURSE_TITLES)} {i + 1}" for i in range(count)
    ]
    levels = list(Course.Level.values)

    for i, title in enumerate(tqdm(titles, desc="Courses", unit="course")):
        slug = unique_slug(title, Course)
        is_free = random.random() < 0.35
        color = (random.randint(180, 230), random.randint(160, 210), random.randint(140, 200))
        course = Course(
            title=title,
            slug=slug,
            description=f"<p>در این دوره با {title} به صورت گام‌به‌گام آشنا می‌شوید.</p><p>مناسب علاقه‌مندان به شیرینی‌پزی در خانه و کسب‌وکارهای کوچک.</p>",
            instructor_name=random.choice(["مریم احمدی", "سارا کریمی", "تیم آموزش شیرینی‌خانه"]),
            level=random.choice(levels),
            is_free=is_free,
            price=None if is_free else random.randint(15, 80) * 10000,
            is_published=True,
        )
        course.thumbnail.save(
            f"course-{slug}.webp",
            make_image_file(f"course-{slug}.webp", color, (640, 360)),
            save=False,
        )
        course.save()

        for j in range(episodes_per_course):
            ep_title = EPISODE_TITLES[j % len(EPISODE_TITLES)]
            if j >= len(EPISODE_TITLES):
                ep_title = f"{ep_title} {j + 1}"
            CourseEpisode.objects.create(
                course=course,
                title=ep_title,
                slug=unique_episode_slug(course, ep_title),
                order=j,
                video_url=DEMO_VIDEO_URL,
                duration_minutes=random.randint(8, 25),
                is_preview=(j == 0),
                description=f"جلسه {j + 1} از دوره {title}.",
            )

        ingredients_text = (
            f"مواد اولیه دوره {title}\n\n"
            "- آرد: ۵۰۰ گرم\n"
            "- شکر: ۲۰۰ گرم\n"
            "- تخم‌مرغ: ۳ عدد\n"
            "- کره: ۱۰۰ گرم\n"
        )
        ingredients_file = CourseFile(
            course=course,
            title="لیست مواد اولیه",
            order=0,
        )
        ingredients_file.file.save(
            f"ingredients-{slug}.txt",
            ContentFile(ingredients_text.encode("utf-8")),
            save=False,
        )
        ingredients_file.save()


def seed_tutorials(count: int) -> None:
    titles = TUTORIAL_TITLES[:count] if count <= len(TUTORIAL_TITLES) else [
        f"{random.choice(TUTORIAL_TITLES)} {i + 1}" for i in range(count)
    ]
    for i, title in enumerate(tqdm(titles, desc="Tutorials", unit="tutorial")):
        slug = unique_slug(title, Tutorial)
        color = (random.randint(160, 220), random.randint(180, 240), random.randint(200, 255))
        t = Tutorial(
            title=title,
            slug=slug,
            description=f"آموزش {title} — مناسب مبتدی و حرفه‌ای.",
            video_url=DEMO_VIDEO_URL,
            duration_minutes=random.randint(8, 45),
            is_published=True,
        )
        t.thumbnail.save(f"tutorial-{slug}.webp", make_image_file(f"tutorial-{slug}.webp", color), save=False)
        t.save()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed dummy data for Sweats E-commerce models.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--users", type=int, default=10, help="Number of users")
    parser.add_argument("--categories", type=int, default=8, help="Number of categories")
    parser.add_argument("--products", type=int, default=40, help="Number of products")
    parser.add_argument(
        "--images-per-product",
        type=int,
        default=1,
        help="Product images per product",
    )
    parser.add_argument("--comments", type=int, default=60, help="Product comments")
    parser.add_argument(
        "--addresses-per-user",
        type=int,
        default=1,
        help="Addresses per user",
    )
    parser.add_argument("--orders", type=int, default=15, help="Orders")
    parser.add_argument(
        "--cart-users",
        type=int,
        default=5,
        help="Users that get a cart with items",
    )
    parser.add_argument("--blog-posts", type=int, default=12, help="Blog posts")
    parser.add_argument("--blog-comments", type=int, default=30, help="Blog comments")
    parser.add_argument("--tutorials", type=int, default=8, help="Tutorial clips")
    parser.add_argument("--courses", type=int, default=4, help="Courses with episodes")
    parser.add_argument(
        "--episodes-per-course",
        type=int,
        default=6,
        help="Episodes per course",
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Delete all seeded data first (keeps superusers)",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    return parser.parse_args()


@transaction.atomic
def main() -> None:
    args = parse_args()
    random.seed(args.seed)

    print("Sweats E-commerce — dummy data generator")
    print("=" * 44)
    for key, val in vars(args).items():
        print(f"  {key}: {val}")
    print("=" * 44)

    if args.clear:
        clear_all_data()

    users = seed_users(args.users)
    seed_wallets(users)
    categories = seed_categories(args.categories)
    if not categories:
        print("No categories created.")
        return
    products = seed_products(args.products, categories)
    if args.images_per_product > 0 and products:
        seed_product_images(products, args.images_per_product)
    if args.comments > 0 and products and users:
        seed_comments(args.comments, products, users)
    addresses = seed_addresses(users, args.addresses_per_user)
    if args.cart_users > 0 and products:
        seed_carts(users, products, args.cart_users)
    if args.orders > 0 and products:
        seed_orders(args.orders, users, addresses, products)
    if args.blog_posts > 0:
        seed_blog(args.blog_posts, args.blog_comments, users)
    if args.courses > 0:
        seed_courses(args.courses, args.episodes_per_course)
    if args.tutorials > 0:
        seed_tutorials(args.tutorials)

    print("\nSeed complete.")
    print(f"  Users:      {User.objects.count()}")
    print(f"  Categories: {Category.objects.count()}")
    print(f"  Products:   {Product.objects.count()}")
    print(f"  Blog posts: {BlogPost.objects.count()}")
    print(f"  Courses:    {Course.objects.count()}")
    print(f"  Episodes:   {CourseEpisode.objects.count()}")
    print(f"  Tutorials:  {Tutorial.objects.count()}")
    print(f"  Orders:     {Order.objects.count()}")
    print(f"  Wallets:    {Wallet.objects.count()}")


if __name__ == "__main__":
    main()
