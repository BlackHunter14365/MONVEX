"""
Transactions Serializers
"""
from rest_framework import serializers
from .models import Category, Merchant, Transaction, RecurringPayment

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'icon', 'color', 'is_system_default']

class MerchantSerializer(serializers.ModelSerializer):
    default_category_name = serializers.CharField(source='default_category.name', read_only=True)

    class Meta:
        model = Merchant
        fields = ['id', 'name', 'normalized_name', 'default_category', 'default_category_name']

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    merchant_name = serializers.CharField(source='merchant.normalized_name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'amount', 'type', 'date', 'description',
            'category', 'category_name', 'category_color', 'category_icon',
            'merchant', 'merchant_name', 'source', 'confidence',
            'raw_text', 'is_recurring', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'confidence']

class CreateTransactionInputSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    type = serializers.ChoiceField(choices=['INCOME', 'EXPENSE', 'TRANSFER'], default='EXPENSE')
    date = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    category_id = serializers.UUIDField(required=False, allow_null=True)
    category_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    merchant_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    source = serializers.ChoiceField(choices=['MANUAL', 'VOICE', 'RECEIPT', 'IMPORT', 'AI'], default='MANUAL')
    raw_text = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_date(self, value):
        if not value:
            return None
        if isinstance(value, str):
            clean_str = value.split('T')[0].strip()
            from datetime import datetime
            try:
                return datetime.strptime(clean_str, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Date has wrong format. Use YYYY-MM-DD.")
        return value

class NaturalLanguageParseInputSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=500)

class RecurringPaymentSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    merchant_name = serializers.CharField(source='merchant.normalized_name', read_only=True)

    class Meta:
        model = RecurringPayment
        fields = [
            'id', 'name', 'amount', 'frequency', 'next_due_date',
            'is_active', 'category', 'category_name', 'merchant', 'merchant_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AssetSerializer(serializers.ModelSerializer):
    asset_type_label = serializers.CharField(source='get_asset_type_display', read_only=True)

    class Meta:
        from .models import Asset
        model = Asset
        fields = [
            'id', 'name', 'asset_type', 'asset_type_label',
            'value', 'institution', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LiabilitySerializer(serializers.ModelSerializer):
    liability_type_label = serializers.CharField(source='get_liability_type_display', read_only=True)

    class Meta:
        from .models import Liability
        model = Liability
        fields = [
            'id', 'name', 'liability_type', 'liability_type_label',
            'principal_amount', 'remaining_balance', 'interest_rate_pct',
            'tenure_months', 'monthly_emi', 'start_date', 'next_due_date',
            'lender', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import Receipt
        model = Receipt
        fields = [
            'id', 'merchant_name', 'date', 'subtotal', 'tax_amount',
            'discount_amount', 'total_amount', 'currency', 'predicted_category',
            'confidence_score', 'status', 'items', 'raw_ocr_text',
            'image_url', 'confirmed_transaction', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import Notification
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'severity', 'is_read', 'action_url', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

