"""
Transaction Service
Encapsulates business logic for transactions, category mapping, merchant normalization and natural language parsing.
"""
import re
from datetime import date, datetime
from decimal import Decimal
from django.db import transaction as db_transaction
from django.contrib.auth.models import User
from apps.transactions.models import Transaction, Category, Merchant
from ml.categorizer import categorizer

class TransactionService:

    @staticmethod
    def normalize_merchant_name(raw_name: str) -> str:
        """Normalize variants e.g. 'AMZN Mktp IN', 'Amazon.in' -> 'Amazon'"""
        if not raw_name:
            return ""
        name = raw_name.strip()
        patterns = [
            (r'(?i)^(amazon|amzn)(\.in|\s+india|\s+mktp.*|\s+retail.*|\s+pay)?$', 'Amazon'),
            (r'(?i)^(swiggy|swgy)(\s+instamart|\s+order|\s+delivery|\s+pay)?$', 'Swiggy'),
            (r'(?i)^(zomato|zmt)(\s+order|\s+delivery|\s+gold|\s+dining)?$', 'Zomato'),
            (r'(?i)^(blinkit)(\s+commerce|\s+instant)?$', 'Blinkit'),
            (r'(?i)^(zepto)(\s+delivery|\s+instant)?$', 'Zepto'),
            (r'(?i)^(uber)(\s+india|\s+trip|\s+ride|\s+auto)?$', 'Uber'),
            (r'(?i)^(ola)(\s+cabs|\s+money|\s+ride|\s+auto)?$', 'Ola'),
            (r'(?i)^(netflix)(\s+subscription|\s+streaming|\s+monthly)?$', 'Netflix'),
            (r'(?i)^(spotify)(\s+india|\s+premium)?$', 'Spotify'),
            (r'(?i)^(starbucks)(\s+coffee)?$', 'Starbucks'),
            (r'(?i)^(flipkart)(\s+internet|\s+shopping)?$', 'Flipkart'),
            (r'(?i)^(myntra)(\s+designs|\s+fashion)?$', 'Myntra'),
        ]
        for pattern, replacement in patterns:
            if re.match(pattern, name):
                return replacement
        return name.title()

    @staticmethod
    def get_or_create_merchant(merchant_name: str, default_category: Category = None) -> Merchant:
        if not merchant_name:
            return None
        normalized = TransactionService.normalize_merchant_name(merchant_name)
        merchant, created = Merchant.objects.get_or_create(
            normalized_name=normalized,
            defaults={'name': merchant_name, 'default_category': default_category}
        )
        if default_category and not merchant.default_category:
            merchant.default_category = default_category
            merchant.save(update_fields=['default_category'])
        return merchant

    @staticmethod
    def get_or_create_category(user: User, category_name: str, category_type: str = 'EXPENSE') -> Category:
        if not category_name:
            category_name = 'Other Expense' if category_type == 'EXPENSE' else 'Other Income'

        # Look for system default or user's custom category
        category = Category.objects.filter(name__iexact=category_name).first()
        if not category:
            category = Category.objects.create(
                user=user,
                name=category_name,
                type=category_type,
                is_system_default=False
            )
        return category

    @staticmethod
    def parse_natural_language_transaction(text: str) -> dict:
        """
        Extract financial entities from natural language / voice input
        Example: "Aaj Swiggy pe 620 rupaye kharch kiye"
        """
        from services.nlp_parser import NLPFinancialParser
        return NLPFinancialParser.parse(text)

    @staticmethod
    @db_transaction.atomic
    def create_transaction(
        user: User,
        amount: Decimal,
        type: str = 'EXPENSE',
        date_val: date = None,
        description: str = '',
        category_id: str = None,
        category_name: str = None,
        merchant_name: str = None,
        source: str = 'MANUAL',
        raw_text: str = ''
    ) -> Transaction:
        """Atomic creation of a transaction with merchant normalization and ML classification"""
        if date_val is None:
            date_val = date.today()

        category = None
        confidence = Decimal('1.0000')

        # Category resolution
        if category_id:
            category = Category.objects.filter(id=category_id).first()
        elif category_name:
            category = TransactionService.get_or_create_category(user, category_name, type)
        else:
            # Predict category using ML categorizer
            ml_pred = categorizer.predict(description, merchant_name or "")
            category = TransactionService.get_or_create_category(user, ml_pred['category'], type)
            confidence = Decimal(str(ml_pred['confidence']))

        # Merchant resolution
        merchant = None
        if merchant_name:
            merchant = TransactionService.get_or_create_merchant(merchant_name, category)

        transaction_obj = Transaction.objects.create(
            user=user,
            amount=amount,
            type=type,
            date=date_val,
            description=description,
            category=category,
            merchant=merchant,
            source=source,
            confidence=confidence,
            raw_text=raw_text
        )

        return transaction_obj
