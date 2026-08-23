"""
Analytics Views
"""
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from services.finance_service import FinanceService
from services.forecast_service import ForecastService
from apps.ai_copilot.models import AnomalyEvent
from apps.ai_copilot.serializers import AnomalyEventSerializer

class DashboardMetricsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        metrics = FinanceService.get_dashboard_metrics(request.user)
        return Response(metrics, status=status.HTTP_200_OK)

class FinancialHealthScoreView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        health_score = FinanceService.calculate_financial_health_score(request.user)
        return Response(health_score, status=status.HTTP_200_OK)

class CashflowForecastView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        forecast = ForecastService.forecast_cash_flow(request.user, days=days)
        return Response(forecast, status=status.HTTP_200_OK)

class AnomalyListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        anomalies = AnomalyEvent.objects.filter(user=request.user).select_related('transaction')
        serializer = AnomalyEventSerializer(anomalies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AnomalyStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            anomaly = AnomalyEvent.objects.get(pk=pk, user=request.user)
        except AnomalyEvent.DoesNotExist:
            return Response({"error": "Anomaly not found"}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status in ['CONFIRMED', 'DISMISSED']:
            anomaly.status = new_status
            anomaly.save(update_fields=['status'])
            return Response(AnomalyEventSerializer(anomaly).data, status=status.HTTP_200_OK)
        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
