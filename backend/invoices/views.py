from decimal import Decimal
from django.contrib.auth import login, logout
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Client, Invoice, Payment, ShopSettings
from .serializers import (
    ClientSerializer, ClientSummarySerializer, InvoiceSerializer,
    LoginSerializer, PaymentSerializer, ShopSettingsSerializer,
)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        login(request, serializer.validated_data["user"])
        return Response({"detail": "Logged in."})


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out."})


class MeView(APIView):
    def get(self, request):
        return Response({"username": request.user.username, "id": request.user.id})


class ChangePasswordView(APIView):
    def post(self, request):
        old = request.data.get("old_password", "")
        new = request.data.get("new_password", "")
        if not request.user.check_password(old):
            return Response({"detail": "كلمة المرور الحالية غير صحيحة"}, status=400)
        if len(new) < 8:
            return Response({"detail": "كلمة المرور يجب أن تكون ٨ أحرف على الأقل"}, status=400)
        request.user.set_password(new)
        request.user.save()
        login(request, request.user)
        return Response({"detail": "تم تغيير كلمة المرور."})


class ShopSettingsView(APIView):
    def get(self, request):
        s = ShopSettings.get()
        return Response(ShopSettingsSerializer(s).data)

    def patch(self, request):
        s = ShopSettings.get()
        serializer = ShopSettingsSerializer(s, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ClientListCreateView(generics.ListCreateAPIView):
    serializer_class = ClientSerializer

    def get_queryset(self):
        qs = Client.objects.all()
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(name__icontains=q)
        return qs


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer


class ClientSummaryView(APIView):
    def get(self, request, pk):
        try:
            client = Client.objects.get(pk=pk)
        except Client.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        serializer = ClientSummarySerializer(client)
        return Response(serializer.data)


class InvoiceListCreateView(generics.ListCreateAPIView):
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        qs = Invoice.objects.all()
        client_id = self.request.query_params.get("client")
        status_filter = self.request.query_params.get("status")
        archived = self.request.query_params.get("archived")

        if client_id:
            qs = qs.filter(client_id=client_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if archived == "true":
            cutoff = timezone.now() - timezone.timedelta(hours=48)
            qs = qs.filter(status="paid", paid_at__lt=cutoff)
        elif archived == "false":
            cutoff = timezone.now() - timezone.timedelta(hours=48)
            qs = qs.exclude(status="paid", paid_at__lt=cutoff)

        return qs


class InvoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer


class PaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentSerializer

    def get_queryset(self):
        qs = Payment.objects.all()
        client_id = self.request.query_params.get("client")
        if client_id:
            qs = qs.filter(client_id=client_id)
        return qs


class DashboardView(APIView):
    def get(self, request):
        rate = ShopSettings.get().ll_per_usd
        cutoff = timezone.now() - timezone.timedelta(hours=48)

        active_invoices = Invoice.objects.exclude(
            status="paid", paid_at__lt=cutoff
        ).exclude(status="paid", paid_at__isnull=True)

        unpaid_qs = Invoice.objects.filter(status__in=["unpaid", "partial"])
        total_usd = sum((inv.remaining_usd() for inv in unpaid_qs), Decimal("0"))
        total_ll = (total_usd * Decimal(str(rate))).quantize(Decimal("1"))

        recently_paid = Invoice.objects.filter(
            status="paid", paid_at__gte=cutoff
        ).order_by("-paid_at")

        active = Invoice.objects.filter(status__in=["unpaid", "partial"]).order_by("created_at")

        return Response({
            "total_owed_usd": str(total_usd),
            "total_owed_ll": str(total_ll),
            "ll_per_usd": str(rate),
            "active_invoices": InvoiceSerializer(active, many=True).data,
            "recently_paid": InvoiceSerializer(recently_paid, many=True).data,
        })


class ArchiveView(APIView):
    def get(self, request):
        cutoff = timezone.now() - timezone.timedelta(hours=48)
        qs = Invoice.objects.filter(status="paid", paid_at__lt=cutoff).order_by("-paid_at")

        q = request.query_params.get("q")
        if q:
            qs = qs.filter(name__icontains=q) | qs.filter(reference__icontains=q)

        client_id = request.query_params.get("client")
        if client_id:
            qs = qs.filter(client_id=client_id)

        return Response(InvoiceSerializer(qs, many=True).data)
