from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from apps.authentication.models import Profile

class ProfileUpdateTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='test_pilot', email='test_pilot@example.com', password='Password123!')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_update_profile_fields_via_auth_me(self):
        response = self.client.patch('/api/v1/auth/me/', {
            'first_name': 'Pilot',
            'last_name': 'Tester',
            'monthly_income': 95000.00,
            'currency': 'INR',
            'phone_number': '+919876543210'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Pilot')
        self.assertEqual(self.user.last_name, 'Tester')
        self.assertEqual(float(self.user.profile.monthly_income), 95000.00)
        self.assertEqual(self.user.profile.phone_number, '+919876543210')

    def test_update_username_success(self):
        response = self.client.patch('/api/v1/auth/me/', {
            'username': 'pilot_updated'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, 'pilot_updated')

    def test_update_username_duplicate_rejected(self):
        User.objects.create_user(username='existing_user', email='existing@example.com', password='Password123!')
        response = self.client.patch('/api/v1/auth/me/', {
            'username': 'existing_user'
        }, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('username', str(response.data))
