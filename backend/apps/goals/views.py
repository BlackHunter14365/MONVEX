import time
from django.db import transaction as db_transaction, models
from django.db.utils import OperationalError
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import SavingsGoal, GoalContribution
from .serializers import SavingsGoalSerializer, ContributeGoalInputSerializer

class SavingsGoalListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SavingsGoalSerializer
    pagination_class = None

    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user).prefetch_related('contributions')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SavingsGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SavingsGoalSerializer

    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user).prefetch_related('contributions')

class ContributeGoalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        serializer = ContributeGoalInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data['amount']
        notes = serializer.validated_data.get('notes', '')

        for attempt in range(5):
            try:
                with db_transaction.atomic():
                    goal = generics.get_object_or_404(
                        SavingsGoal,
                        pk=pk,
                        user=request.user
                    )

                    # Record contribution and update goal current amount atomically
                    GoalContribution.objects.create(
                        goal=goal,
                        amount=amount,
                        notes=notes
                    )
                    SavingsGoal.objects.filter(pk=goal.pk).update(
                        current_amount=models.F('current_amount') + amount
                    )
                    goal.refresh_from_db()
                    if goal.current_amount >= goal.target_amount:
                        goal.status = 'COMPLETED'
                        goal.save(update_fields=['status'])

                return Response(SavingsGoalSerializer(goal).data, status=status.HTTP_200_OK)
            except OperationalError as exc:
                if 'locked' in str(exc).lower() and attempt < 4:
                    time.sleep(0.05 * (attempt + 1))
                    continue
                raise
