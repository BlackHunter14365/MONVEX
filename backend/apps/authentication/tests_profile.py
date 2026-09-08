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

    def test_update_bio_theme_preferences_via_auth_me(self):
        response = self.client.patch('/api/v1/auth/me/', {
            'bio': 'Financial freedom enthusiast 🚀',
            'theme': 'emerald',
            'avatar_preset': 'pres_2',
            'preferences': {
                'fiscalStartDay': '5',
                'notifAnomaly': True,
                'aiAutoCategorize': True
            }
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.profile.bio, 'Financial freedom enthusiast 🚀')
        self.assertEqual(self.user.profile.theme, 'emerald')
        self.assertEqual(self.user.profile.avatar_preset, 'pres_2')
        self.assertEqual(self.user.profile.preferences.get('fiscalStartDay'), '5')
        self.assertTrue(self.user.profile.preferences.get('notifAnomaly'))

        # Verify returned data has them at top level
        self.assertEqual(response.data.get('bio'), 'Financial freedom enthusiast 🚀')
        self.assertEqual(response.data.get('theme'), 'emerald')
        self.assertEqual(response.data.get('avatar_preset'), 'pres_2')

    def test_avatar_upload_and_delete(self):
        import io
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile

        # Create a test image in memory
        img = Image.new('RGB', (100, 100), color=(73, 109, 137))
        img_io = io.BytesIO()
        img.save(img_io, format='JPEG')
        img_io.seek(0)

        uploaded = SimpleUploadedFile('test_avatar.jpg', img_io.getvalue(), content_type='image/jpeg')
        response = self.client.post('/api/v1/auth/profile/avatar/', {'avatar': uploaded}, format='multipart')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('success'))
        self.assertTrue(response.data.get('avatar_url').startswith('data:image/jpeg;base64,'))

        self.user.refresh_from_db()
        self.assertTrue(bool(self.user.profile.avatar_url))

        # Delete avatar
        del_resp = self.client.delete('/api/v1/auth/profile/avatar/')
        self.assertEqual(del_resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.profile.avatar_url, '')
        self.assertEqual(self.user.profile.avatar_preset, '')
