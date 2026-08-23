"""
Budgets Serializers
"""
from rest_framework import serializers
from apps.transactions.models import Category
from .models import Budget, BudgetHistory

class BudgetSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False)
    category_id = serializers.UUIDField(required=False, write_only=True)
    category_name = serializers.CharField(required=False, allow_blank=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)
    is_active = serializers.BooleanField(default=True)

    class Meta:
        model = Budget
        fields = [
            'id', 'category', 'category_id', 'category_name', 'category_icon', 'category_color',
            'limit_amount', 'amount', 'period', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'limit_amount': {'required': False}
        }

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)

        # Map amount -> limit_amount
        if 'amount' in ret and 'limit_amount' not in ret:
            ret['limit_amount'] = ret.pop('amount')
        elif 'limit_amount' not in ret and 'amount' in data:
            try:
                ret['limit_amount'] = float(data['amount'])
            except (ValueError, TypeError):
                pass

        # Resolve category from category_id or category_name
        if 'category' not in ret:
            cat_id = data.get('category_id') or (data.get('category') if isinstance(data.get('category'), str) and len(str(data.get('category'))) > 30 else None)
            cat_name = data.get('category_name') or (data.get('category') if isinstance(data.get('category'), str) and len(str(data.get('category'))) <= 30 else None)

            user = self.context['request'].user if 'request' in self.context else None

            if cat_id:
                cat = Category.objects.filter(id=cat_id).first()
                if cat:
                    ret['category'] = cat
            elif cat_name and user:
                from services.transaction_service import TransactionService
                ret['category'] = TransactionService.get_or_create_category(user, str(cat_name), 'EXPENSE')
            elif cat_name:
                cat = Category.objects.filter(name__iexact=str(cat_name)).first()
                if cat:
                    ret['category'] = cat

        if 'category' not in ret:
            raise serializers.ValidationError({"category": "Category or category_name is required."})

        if 'limit_amount' not in ret:
            raise serializers.ValidationError({"limit_amount": "Limit amount is required."})

        return ret

    def create(self, validated_data):
        validated_data.pop('amount', None)
        validated_data.pop('category_id', None)
        validated_data.pop('category_name', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('amount', None)
        validated_data.pop('category_id', None)
        validated_data.pop('category_name', None)
        return super().update(instance, validated_data)

class BudgetOverviewItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    category_id = serializers.CharField()
    category_name = serializers.CharField()
    category_icon = serializers.CharField()
    category_color = serializers.CharField()
    limit_amount = serializers.FloatField()
    spent_amount = serializers.FloatField()
    remaining_amount = serializers.FloatField()
    usage_percentage = serializers.FloatField()
    daily_velocity = serializers.FloatField()
    projected_month_end = serializers.FloatField()
    projected_variance = serializers.FloatField()
    status = serializers.CharField()
    days_remaining = serializers.IntegerField()
