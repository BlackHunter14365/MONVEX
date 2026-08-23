"""
Budgets Views
"""
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Budget
from .serializers import BudgetSerializer
from services.budget_service import BudgetService

class BudgetListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BudgetSerializer
    pagination_class = None

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).select_related('category')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = serializer.validated_data['category']
        period = serializer.validated_data.get('period', 'MONTHLY')
        limit_amount = serializer.validated_data['limit_amount']
        is_active = serializer.validated_data.get('is_active', True)

        budget, created = Budget.objects.update_or_create(
            user=request.user,
            category=category,
            period=period,
            defaults={
                'limit_amount': limit_amount,
                'is_active': is_active
            }
        )
        output_serializer = self.get_serializer(budget)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BudgetSerializer

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

class BudgetOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        overview = BudgetService.get_budget_overview(request.user)
        return Response(overview, status=status.HTTP_200_OK)
