"""
Transaction & Financial Entities Models
"""
import uuid
from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    TYPE_CHOICES = [
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='categories')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='EXPENSE')
    icon = models.CharField(max_length=50, default='tag')
    color = models.CharField(max_length=20, default='#6366F1')
    is_system_default = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.type})"

class Merchant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    normalized_name = models.CharField(max_length=150, db_index=True)
    default_category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.normalized_name

class Transaction(models.Model):
    TYPE_CHOICES = [
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
        ('TRANSFER', 'Transfer'),
    ]

    SOURCE_CHOICES = [
        ('MANUAL', 'Manual'),
        ('VOICE', 'Voice'),
        ('RECEIPT', 'Receipt'),
        ('IMPORT', 'Import'),
        ('AI', 'AI-assisted'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions', db_index=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    merchant = models.ForeignKey(Merchant, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='EXPENSE', db_index=True)
    date = models.DateField(db_index=True)
    description = models.CharField(max_length=255, blank=True, default='')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='MANUAL')
    confidence = models.DecimalField(max_digits=5, decimal_places=4, default=1.0000)
    raw_text = models.TextField(blank=True, default='')
    is_recurring = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'category', 'date']),
            models.Index(fields=['user', 'type', 'date']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.type} ₹{self.amount} ({self.category.name if self.category else 'Uncategorized'})"

class RecurringPayment(models.Model):
    FREQUENCY_CHOICES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('YEARLY', 'Yearly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recurring_payments')
    merchant = models.ForeignKey(Merchant, on_delete=models.SET_NULL, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=150)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default='MONTHLY')
    next_due_date = models.DateField(db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - ₹{self.amount} ({self.frequency})"


class Asset(models.Model):
    ASSET_CHOICES = [
        ('CASH', 'Cash & Liquid Savings'),
        ('BANK', 'Bank Savings & Deposits'),
        ('INVESTMENT', 'Stocks, Mutual Funds & ETFs'),
        ('GOLD', 'Physical & Digital Gold'),
        ('REAL_ESTATE', 'Real Estate & Property'),
        ('OTHER', 'Other Assets / Vehicles'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assets')
    name = models.CharField(max_length=150)
    asset_type = models.CharField(max_length=20, choices=ASSET_CHOICES, default='BANK')
    value = models.DecimalField(max_digits=14, decimal_places=2)
    institution = models.CharField(max_length=150, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-value']

    def __str__(self):
        return f"{self.name} ({self.asset_type}): ₹{self.value}"


class Liability(models.Model):
    LIABILITY_CHOICES = [
        ('CREDIT_CARD', 'Credit Card Outstanding'),
        ('PERSONAL_LOAN', 'Personal Loan'),
        ('HOME_LOAN', 'Home / Mortgage Loan'),
        ('AUTO_LOAN', 'Vehicle / Auto Loan'),
        ('EDUCATION_LOAN', 'Education Loan'),
        ('OTHER_DEBT', 'Other Loan / Obligation'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liabilities')
    name = models.CharField(max_length=150)
    liability_type = models.CharField(max_length=20, choices=LIABILITY_CHOICES, default='PERSONAL_LOAN')
    principal_amount = models.DecimalField(max_digits=14, decimal_places=2)
    remaining_balance = models.DecimalField(max_digits=14, decimal_places=2)
    interest_rate_pct = models.DecimalField(max_digits=6, decimal_places=2, default=10.50)
    tenure_months = models.IntegerField(default=24)
    monthly_emi = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    start_date = models.DateField(null=True, blank=True)
    next_due_date = models.DateField(null=True, blank=True)
    lender = models.CharField(max_length=150, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-remaining_balance']

    def __str__(self):
        return f"{self.name} ({self.liability_type}): ₹{self.remaining_balance} / ₹{self.principal_amount}"


class Receipt(models.Model):
    STATUS_CHOICES = [
        ('PENDING_REVIEW', 'Pending User Review'),
        ('CONFIRMED', 'Confirmed & Transaction Created'),
        ('REJECTED', 'Rejected by User'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='receipts')
    merchant_name = models.CharField(max_length=150, blank=True, default='')
    date = models.DateField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    predicted_category = models.CharField(max_length=100, blank=True, default='Groceries')
    confidence_score = models.DecimalField(max_digits=5, decimal_places=4, default=0.9400)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING_REVIEW')
    items = models.JSONField(default=list, blank=True)
    raw_ocr_text = models.TextField(blank=True, default='')
    image_url = models.TextField(blank=True, default='')
    confirmed_transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='origin_receipt')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Receipt #{str(self.id)[:8]} - {self.merchant_name} ₹{self.total_amount} ({self.status})"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('BUDGET_WARNING', 'Budget Warning'),
        ('UNUSUAL_SPENDING', 'Unusual Spending Alert'),
        ('GOAL_RISK', 'Goal Milestone Risk'),
        ('UPCOMING_PAYMENT', 'Upcoming Bill Due'),
        ('FORECAST_WARNING', 'Cash Flow Runaway Alert'),
        ('DUPLICATE_TRANSACTION', 'Duplicate Charge Detected'),
        ('INSIGHT_AVAILABLE', 'Smart Financial Insight'),
    ]

    SEVERITY_CHOICES = [
        ('INFO', 'Informational'),
        ('WARNING', 'Warning Alert'),
        ('CRITICAL', 'Urgent Action Required'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='INSIGHT_AVAILABLE')
    title = models.CharField(max_length=200)
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='INFO')
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=255, blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.title} for {self.user.username}"

