from decimal import Decimal
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import Client, Invoice, Payment, ShopSettings


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data["username"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        data["user"] = user
        return data


class ShopSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopSettings
        fields = ["ll_per_usd"]


class ClientSerializer(serializers.ModelSerializer):
    total_owed_usd = serializers.SerializerMethodField()
    total_owed_ll = serializers.SerializerMethodField()
    invoice_count = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = ["id", "name", "whatsapp", "created_at", "total_owed_usd", "total_owed_ll", "invoice_count"]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {
            "name": {"error_messages": {"unique": "يوجد عميل بهذا الاسم مسبقاً."}},
        }

    def get_total_owed_usd(self, obj):
        return str(obj.total_owed_usd())

    def get_total_owed_ll(self, obj):
        rate = ShopSettings.get().ll_per_usd
        return str((obj.total_owed_usd() * rate).quantize(Decimal("1")))

    def get_invoice_count(self, obj):
        return obj.invoices.exclude(status="paid").count()


class InvoiceSerializer(serializers.ModelSerializer):
    amount_usd = serializers.SerializerMethodField()
    remaining_usd = serializers.SerializerMethodField()
    remaining_ll = serializers.SerializerMethodField()
    is_archived = serializers.SerializerMethodField()
    client_name = serializers.CharField(source="client.name", read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id", "reference", "client", "client_name", "name", "whatsapp",
            "amount", "currency", "amount_paid_usd", "amount_usd",
            "remaining_usd", "remaining_ll", "status", "description",
            "paid_at", "created_at", "is_archived",
        ]
        read_only_fields = ["id", "reference", "amount_paid_usd", "status", "paid_at", "created_at"]

    def get_amount_usd(self, obj):
        return str(obj.amount_usd())

    def get_remaining_usd(self, obj):
        return str(obj.remaining_usd())

    def get_remaining_ll(self, obj):
        rate = ShopSettings.get().ll_per_usd
        return str((obj.remaining_usd() * rate).quantize(Decimal("1")))

    def get_is_archived(self, obj):
        return obj.is_archived()

    def validate(self, data):
        if not data.get("client") and not data.get("name"):
            raise serializers.ValidationError("Provide either a client or a name.")
        if data.get("client") and not data.get("name"):
            data["name"] = data["client"].name
        if data.get("client") and not data.get("whatsapp"):
            data["whatsapp"] = data["client"].whatsapp
        return data


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "client", "amount", "currency", "amount_usd", "note", "created_at"]
        read_only_fields = ["id", "amount_usd", "created_at"]


class ClientSummarySerializer(serializers.ModelSerializer):
    total_owed_usd = serializers.SerializerMethodField()
    total_owed_ll = serializers.SerializerMethodField()
    unpaid_count = serializers.SerializerMethodField()
    partial_count = serializers.SerializerMethodField()
    invoices = InvoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Client
        fields = [
            "id", "name", "whatsapp", "created_at",
            "total_owed_usd", "total_owed_ll",
            "unpaid_count", "partial_count", "invoices",
        ]

    def get_total_owed_usd(self, obj):
        return str(obj.total_owed_usd())

    def get_total_owed_ll(self, obj):
        rate = ShopSettings.get().ll_per_usd
        return str((obj.total_owed_usd() * rate).quantize(Decimal("1")))

    def get_unpaid_count(self, obj):
        return obj.invoices.filter(status="unpaid").count()

    def get_partial_count(self, obj):
        return obj.invoices.filter(status="partial").count()
