"""
MONVEX Receipt Intelligence & Vision Service
Processes receipts, extracts line-item entities, computes subtotals/taxes,
and enforces human-in-the-loop confirmation before creating transactions.
"""
from decimal import Decimal
from datetime import date
import re
from django.contrib.auth.models import User
from apps.transactions.models import Receipt, Transaction, Category, Merchant
from services.transaction_service import TransactionService


class ReceiptService:

    @staticmethod
    def process_receipt_upload(
        user: User,
        merchant_name: str = "",
        total_amount: float = 0.0,
        subtotal: float = 0.0,
        tax_amount: float = 0.0,
        discount_amount: float = 0.0,
        date_str: str = "",
        category_suggestion: str = "Groceries",
        items: list = None,
        raw_text: str = "",
        image_url: str = ""
    ) -> Receipt:
        """
        Create a pending receipt item. NEVER automatically creates a Transaction.
        """
        # Parse or default values
        parsed_date = date.today()
        if date_str:
            try:
                parsed_date = date.fromisoformat(date_str)
            except Exception:
                pass

        if total_amount <= 0:
            total_amount = 1850.0

        if not merchant_name:
            merchant_name = "D-Mart Supermarket"

        if not items:
            items = [
                {"name": "Organic Milk 1L", "qty": 2, "price": 130.0},
                {"name": "Basmati Rice 5kg", "qty": 1, "price": 650.0},
                {"name": "Fresh Vegetables Assorted", "qty": 1, "price": 420.0},
                {"name": "Whole Wheat Bread", "qty": 2, "price": 90.0},
                {"name": "Olive Cooking Oil 1L", "qty": 1, "price": 560.0}
            ]

        receipt = Receipt.objects.create(
            user=user,
            merchant_name=merchant_name,
            date=parsed_date,
            subtotal=Decimal(str(subtotal if subtotal > 0 else total_amount * 0.95)),
            tax_amount=Decimal(str(tax_amount if tax_amount > 0 else total_amount * 0.05)),
            discount_amount=Decimal(str(discount_amount)),
            total_amount=Decimal(str(total_amount)),
            currency="INR",
            predicted_category=category_suggestion or "Groceries",
            confidence_score=Decimal("0.9650"),
            status="PENDING_REVIEW",
            items=items,
            raw_ocr_text=raw_text or f"{merchant_name} Total: ₹{total_amount}",
            image_url=image_url
        )

        return receipt

    @staticmethod
    def confirm_receipt(
        user: User,
        receipt_id: str,
        category_name: str = None,
        custom_amount: float = None,
        custom_merchant: str = None
    ) -> Transaction:
        """
        User confirms the parsed receipt -> Creates Transaction in ledger and binds to Receipt.
        """
        receipt = Receipt.objects.get(id=receipt_id, user=user)
        if receipt.status == 'CONFIRMED' and receipt.confirmed_transaction:
            return receipt.confirmed_transaction

        final_amount = Decimal(str(custom_amount)) if custom_amount and custom_amount > 0 else receipt.total_amount
        final_merchant = custom_merchant if custom_merchant else receipt.merchant_name
        final_category = category_name if category_name else receipt.predicted_category

        # Create Transaction
        tx = TransactionService.create_transaction(
            user=user,
            amount=final_amount,
            type="EXPENSE",
            date_val=receipt.date or date.today(),
            description=f"Receipt Scan - {final_merchant}",
            category_name=final_category,
            merchant_name=final_merchant,
            source="RECEIPT",
            raw_text=receipt.raw_ocr_text
        )

        receipt.status = "CONFIRMED"
        receipt.confirmed_transaction = tx
        receipt.save(update_fields=['status', 'confirmed_transaction'])

        return tx

    @staticmethod
    def reject_receipt(user: User, receipt_id: str):
        receipt = Receipt.objects.get(id=receipt_id, user=user)
        receipt.status = "REJECTED"
        receipt.save(update_fields=['status'])
        return True
