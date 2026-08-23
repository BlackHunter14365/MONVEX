"""
Goals Serializers
"""
from rest_framework import serializers
from .models import SavingsGoal, GoalContribution

class GoalContributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalContribution
        fields = ['id', 'amount', 'date', 'notes']
        read_only_fields = ['id', 'date']

class SavingsGoalSerializer(serializers.ModelSerializer):
    contributions = GoalContributionSerializer(many=True, read_only=True)
    progress_percentage = serializers.SerializerMethodField()

    name = serializers.CharField(required=False, write_only=True)
    target_date = serializers.DateField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = SavingsGoal
        fields = [
            'id', 'title', 'name', 'target_amount', 'current_amount', 'deadline', 'target_date',
            'monthly_commitment', 'status', 'progress_percentage', 'contributions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'progress_percentage']
        extra_kwargs = {
            'title': {'required': False},
            'deadline': {'required': False, 'allow_null': True}
        }

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        if 'name' in ret:
            if 'title' not in ret or not ret['title']:
                ret['title'] = ret['name']
            del ret['name']
        elif 'title' not in ret and 'name' in data:
            ret['title'] = str(data['name'])

        if 'target_date' in ret:
            if 'deadline' not in ret or not ret['deadline']:
                ret['deadline'] = ret['target_date']
            del ret['target_date']
        elif 'deadline' not in ret and 'target_date' in data:
            ret['deadline'] = data['target_date']

        if 'title' not in ret or not ret['title']:
            raise serializers.ValidationError({"title": "Title or name is required."})

        return ret

    def create(self, validated_data):
        validated_data.pop('name', None)
        validated_data.pop('target_date', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('name', None)
        validated_data.pop('target_date', None)
        return super().update(instance, validated_data)

    def get_progress_percentage(self, obj):
        if obj.target_amount and obj.target_amount > 0:
            return round((float(obj.current_amount) / float(obj.target_amount)) * 100.0, 1)
        return 0.0

class ContributeGoalInputSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    notes = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
