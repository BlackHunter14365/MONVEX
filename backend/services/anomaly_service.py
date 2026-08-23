"""
Anomaly Detection Service
Identifies unusual transactions using statistical deviation and threshold checks.
"""
from decimal import Decimal
from django.db.models import Avg, StdDev, Count
from apps.transactions.models import Transaction
from apps.ai_copilot.models import AnomalyEvent

class AnomalyService:

    @staticmethod
    def evaluate_transaction(transaction: Transaction) -> AnomalyEvent:
        """
        Evaluate a newly recorded transaction against user's historical category distribution.
        """
        if transaction.type != 'EXPENSE' or transaction.amount <= Decimal('0.00'):
            return None

        user = transaction.user
        category = transaction.category

        # If user has profile with monthly income, check if transaction is huge
        profile = getattr(user, 'profile', None)
        if profile and profile.monthly_income > Decimal('0.00'):
            if transaction.amount >= (profile.monthly_income * Decimal('0.40')):
                anomaly = AnomalyEvent.objects.create(
                    user=user,
                    transaction=transaction,
                    score=Decimal('0.8500'),
                    reason=f"Single transaction consumes {round((transaction.amount / profile.monthly_income) * 100)}% of monthly income.",
                    status='PENDING'
                )
                return anomaly

        # Check category historical baseline
        if category:
            stats = Transaction.objects.filter(
                user=user,
                category=category,
                type='EXPENSE'
            ).exclude(id=transaction.id).aggregate(
                avg_amount=Avg('amount'),
                count=Count('id')
            )

            avg_val = stats['avg_amount']
            count_val = stats['count']

            if count_val >= 3 and avg_val and avg_val > Decimal('0.00'):
                multiplier = transaction.amount / avg_val
                if multiplier >= Decimal('2.50'):
                    score = min(Decimal('0.9500'), Decimal('0.5000') + (multiplier * Decimal('0.1000')))
                    anomaly = AnomalyEvent.objects.create(
                        user=user,
                        transaction=transaction,
                        score=score,
                        reason=f"Amount ₹{transaction.amount} is {multiplier:.1f}x higher than category average (₹{avg_val:.2f}).",
                        status='PENDING'
                    )
                    return anomaly

        return None
