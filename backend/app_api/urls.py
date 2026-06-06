from django.urls import path

from app_account.views import (
    AddressDetailView,
    AddressListCreateView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
)
from app_content.views import (
    BlogCommentCreateView,
    BlogPostDetailView,
    BlogPostListView,
    CourseDetailView,
    CourseEnrollView,
    CourseFileListView,
    CourseListView,
    CourseMyReviewView,
    CoursePurchaseCallbackView,
    CourseReviewCreateView,
    TutorialDetailView,
    TutorialListView,
)
from app_payment.views import (
    WalletDetailView,
    WalletPayOrderView,
    WalletTopUpCallbackView,
    WalletTopUpMockPayView,
    WalletTopUpView,
    WalletTransactionListView,
)
from app_product.views import (
    CategoryListView,
    ProductCommentCreateView,
    ProductDetailView,
    ProductListView,
    RelatedProductListView,
)
from app_order.views import (
    CartItemAddView,
    CartItemDeleteView,
    CartItemUpdateView,
    CartMergeView,
    CartView,
    CheckoutView,
    OrderDetailView,
    OrderListView,
    OrderPaymentCallbackView,
)

from app_chat.views import ContactFormView, SupportMessageCreateView, SupportThreadView
from app_main.views import DatabaseBackupListCreateView

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="api-auth-login"),
    path("auth/register/", RegisterView.as_view(), name="api-auth-register"),
    path("auth/logout/", LogoutView.as_view(), name="api-auth-logout"),
    path("auth/me/", MeView.as_view(), name="api-auth-me"),
    path("addresses/", AddressListCreateView.as_view(), name="api-addresses"),
    path("addresses/<int:pk>/", AddressDetailView.as_view(), name="api-address-detail"),
    path("cart/", CartView.as_view(), name="api-cart"),
    path("cart/items/", CartItemAddView.as_view(), name="api-cart-items"),
    path("cart/items/<int:item_id>/", CartItemUpdateView.as_view(), name="api-cart-item-update"),
    path("cart/items/<int:item_id>/remove/", CartItemDeleteView.as_view(), name="api-cart-item-delete"),
    path("cart/merge/", CartMergeView.as_view(), name="api-cart-merge"),
    path("checkout/", CheckoutView.as_view(), name="api-checkout"),
    path(
        "orders/payment/callback/",
        OrderPaymentCallbackView.as_view(),
        name="api-order-payment-callback",
    ),
    path("orders/", OrderListView.as_view(), name="api-orders"),
    path("orders/<int:pk>/", OrderDetailView.as_view(), name="api-order-detail"),
    path("wallet/", WalletDetailView.as_view(), name="api-wallet"),
    path("wallet/transactions/", WalletTransactionListView.as_view(), name="api-wallet-transactions"),
    path("wallet/top-up/", WalletTopUpView.as_view(), name="api-wallet-top-up"),
    path(
        "wallet/top-up/callback/",
        WalletTopUpCallbackView.as_view(),
        name="api-wallet-top-up-callback",
    ),
    path(
        "wallet/top-up/mock/",
        WalletTopUpMockPayView.as_view(),
        name="api-wallet-top-up-mock",
    ),
    path("wallet/pay-order/<int:order_id>/", WalletPayOrderView.as_view(), name="api-wallet-pay-order"),
    path("categories/", CategoryListView.as_view(), name="api-categories"),
    path("products/", ProductListView.as_view(), name="api-products"),
    path("products/<str:slug>/", ProductDetailView.as_view(), name="api-product-detail"),
    path(
        "products/<str:slug>/related/",
        RelatedProductListView.as_view(),
        name="api-product-related",
    ),
    path(
        "products/<str:slug>/comments/",
        ProductCommentCreateView.as_view(),
        name="api-product-comments",
    ),
    path("blog/", BlogPostListView.as_view(), name="api-blog"),
    path("blog/<str:slug>/", BlogPostDetailView.as_view(), name="api-blog-detail"),
    path(
        "blog/<str:slug>/comments/",
        BlogCommentCreateView.as_view(),
        name="api-blog-comments",
    ),
    path("courses/", CourseListView.as_view(), name="api-courses"),
    path("courses/<str:slug>/", CourseDetailView.as_view(), name="api-course-detail"),
    path("courses/<str:slug>/enroll/", CourseEnrollView.as_view(), name="api-course-enroll"),
    path("courses/<str:slug>/files/", CourseFileListView.as_view(), name="api-course-files"),
    path(
        "courses/purchase/callback/",
        CoursePurchaseCallbackView.as_view(),
        name="api-course-purchase-callback",
    ),
    path(
        "courses/<str:slug>/reviews/",
        CourseReviewCreateView.as_view(),
        name="api-course-reviews",
    ),
    path(
        "courses/<str:slug>/reviews/mine/",
        CourseMyReviewView.as_view(),
        name="api-course-my-review",
    ),
    path("tutorials/", TutorialListView.as_view(), name="api-tutorials"),
    path("tutorials/<str:slug>/", TutorialDetailView.as_view(), name="api-tutorial-detail"),
    path("support/thread/", SupportThreadView.as_view(), name="api-support-thread"),
    path("support/messages/", SupportMessageCreateView.as_view(), name="api-support-messages"),
    path("contact/", ContactFormView.as_view(), name="api-contact"),
    path("admin/backups/", DatabaseBackupListCreateView.as_view(), name="api-admin-backups"),
]
