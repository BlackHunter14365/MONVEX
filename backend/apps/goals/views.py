"""
Goals Views
"""
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
        goal = generics.get_object_or_404(SavingsGoal, pk=pk, user=request.user)
        serializer = ContributeGoalInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data['amount']
        notes = serializer.validated_data.get('notes', '')

        # Record contribution and update goal current amount
        GoalContribution.objects.create(
            goal=goal,
            amount=amount,
            notes=notes
        )
        goal.current_amount += amount
        if goal.current_amount >= goal.target_amount:
            goal.status = 'COMPLETED'
        goal.save()

        return Response(SavingsGoalSerializer(goal).data, status=status.HTTP_200_OK)
