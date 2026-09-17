from django.db import models
from django.utils import timezone


class ShopSettings(models.Model):
    ll_per_usd = models.DecimalField(max_digits=12, decimal_places=2, default=89500)

    class Meta:
        verbose_name = "Shop Settings"

    def __str__(self):
        return f"1 USD = {self.ll_per_usd} L.L."

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Client(models.Model):
    name = models.CharField(max_length=200)
    whatsapp = models.CharField(max_length=30)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def total_owed_usd(self):
        from decimal import Decimal
        total = Decimal("0")
        for inv in self.invoices.exclude(status="paid"):
            total += inv.remaining_usd()
        return total


class Invoice(models.Model):
    CURRENCY_USD = "USD"
    CURRENCY_LBP = "LBP"
    CURRENCY_CHOICES = [(CURRENCY_USD, "USD"), (CURRENCY_LBP, "L.L.")]

    STATUS_UNPAID = "unpaid"
    STATUS_PARTIAL = "partial"
    STATUS_PAID = "paid"
    STATUS_CHOICES = [
        (STATUS_UNPAID, "Unpaid"),
        (STATUS_PARTIAL, "Partial"),
        (STATUS_PAID, "Paid"),
    ]

    reference = models.CharField(max_length=20, unique=True, editable=False)
    client = models.ForeignKey(
        Client, null=True, blank=True, on_delete=models.SET_NULL, related_name="invoices"
    )
    name = models.CharField(max_length=200)
    whatsapp = models.CharField(max_length=30, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default=CURRENCY_USD)
    amount_paid_usd = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_UNPAID)
    description = models.TextField(blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.reference} — {self.name}"

    def save(self, *args, **kwargs):
        if not self.reference:
            last = Invoice.objects.order_by("-id").first()
            next_num = (last.id + 1) if last else 1
            self.reference = f"INV-{next_num:04d}"
        super().save(*args, **kwargs)

    def amount_usd(self):
        if self.currency == self.CURRENCY_USD:
            return self.amount
        rate = ShopSettings.get().ll_per_usd
        return (self.amount / rate).quantize(self.amount)

    def remaining_usd(self):
        from decimal import Decimal
        remaining = self.amount_usd() - self.amount_paid_usd
        return max(remaining, Decimal("0"))

    def apply_payment(self, usd_amount):
        """Apply up to usd_amount USD to this invoice. Returns amount consumed."""
        from decimal import Decimal
        remaining = self.remaining_usd()
        consumed = min(usd_amount, remaining)
        self.amount_paid_usd += consumed
        if self.remaining_usd() <= Decimal("0.001"):
            self.status = self.STATUS_PAID
            self.paid_at = timezone.now()
        else:
            self.status = self.STATUS_PARTIAL
        self.save()
        return consumed

    def is_archived(self):
        if self.status != self.STATUS_PAID or not self.paid_at:
            return False
        return (timezone.now() - self.paid_at).total_seconds() > 48 * 3600


class Payment(models.Model):
    CURRENCY_USD = "USD"
    CURRENCY_LBP = "LBP"
    CURRENCY_CHOICES = [(CURRENCY_USD, "USD"), (CURRENCY_LBP, "L.L.")]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default=CURRENCY_USD)
    amount_usd = models.DecimalField(max_digits=12, decimal_places=4)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment {self.amount} {self.currency} for {self.client}"

    def save(self, *args, **kwargs):
        rate = ShopSettings.get().ll_per_usd
        if self.currency == self.CURRENCY_USD:
            self.amount_usd = self.amount
        else:
            self.amount_usd = (self.amount / rate)
        super().save(*args, **kwargs)
        self._distribute()

    def _distribute(self):
        """Apply payment to oldest unpaid/partial invoices for this client."""
        remaining = self.amount_usd
        invoices = self.client.invoices.filter(
            status__in=[Invoice.STATUS_UNPAID, Invoice.STATUS_PARTIAL]
        ).order_by("created_at")
        for inv in invoices:
            if remaining <= 0:
                break
            remaining -= inv.apply_payment(remaining)
