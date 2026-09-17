from django.urls import path
from . import views

urlpatterns = [
    path("auth/login/", views.LoginView.as_view()),
    path("auth/logout/", views.LogoutView.as_view()),
    path("auth/me/", views.MeView.as_view()),

    path("settings/", views.ShopSettingsView.as_view()),

    path("clients/", views.ClientListCreateView.as_view()),
    path("clients/<int:pk>/", views.ClientDetailView.as_view()),
    path("clients/<int:pk>/summary/", views.ClientSummaryView.as_view()),

    path("invoices/", views.InvoiceListCreateView.as_view()),
    path("invoices/<int:pk>/", views.InvoiceDetailView.as_view()),

    path("payments/", views.PaymentListCreateView.as_view()),

    path("dashboard/", views.DashboardView.as_view()),
    path("archive/", views.ArchiveView.as_view()),
]
