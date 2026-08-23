"""
Authentication & Verification Serializers
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Profile, VerificationSession

class ProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    has_google_auth = serializers.SerializerMethodField()
    has_password_auth = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'id', 'first_name', 'last_name', 'phone_number', 'status', 'email_verified', 'is_verified',
            'currency', 'monthly_income', 'savings_target_percentage', 'theme',
            'has_google_auth', 'has_password_auth'
        ]

    def get_has_google_auth(self, obj):
        return obj.user.google_identities.exists()

    def get_has_password_auth(self, obj):
        return obj.user.has_usable_password()

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        if user_data:
            user = instance.user
            if 'first_name' in user_data:
                user.first_name = user_data['first_name']
            if 'last_name' in user_data:
                user.last_name = user_data['last_name']
            user.save()
        return super().update(instance, validated_data)

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    currency = serializers.CharField(source='profile.currency', required=False)
    monthly_income = serializers.DecimalField(source='profile.monthly_income', max_digits=12, decimal_places=2, required=False)
    phone_number = serializers.CharField(source='profile.phone_number', required=False, allow_blank=True)
    is_verified = serializers.BooleanField(source='profile.email_verified', read_only=True)
    status = serializers.CharField(source='profile.status', read_only=True)
    has_google_auth = serializers.SerializerMethodField()
    has_password_auth = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone_number',
            'currency', 'monthly_income', 'is_verified', 'status',
            'has_google_auth', 'has_password_auth', 'profile'
        ]
        read_only_fields = ['id', 'username', 'email', 'is_verified', 'status', 'has_google_auth', 'has_password_auth']

    def get_has_google_auth(self, obj):
        return obj.google_identities.exists()

    def get_has_password_auth(self, obj):
        return obj.has_usable_password()

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        if 'first_name' in validated_data:
            instance.first_name = validated_data['first_name']
        if 'last_name' in validated_data:
            instance.last_name = validated_data['last_name']
        instance.save()

        profile = getattr(instance, 'profile', None)
        if profile and profile_data:
            if 'currency' in profile_data:
                profile.currency = profile_data['currency']
            if 'monthly_income' in profile_data:
                profile.monthly_income = profile_data['monthly_income']
            if 'phone_number' in profile_data:
                profile.phone_number = profile_data['phone_number']
            profile.save()
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, default='', allow_blank=True)
    currency = serializers.CharField(required=False, default='INR')
    monthly_income = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=75000.00)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'phone_number', 'first_name', 'last_name', 'currency', 'monthly_income']
        extra_kwargs = {
            'username': {'validators': []},
            'email': {'validators': []},
        }

    def validate(self, attrs):
        confirm_pwd = attrs.get('confirm_password')
        if confirm_pwd and attrs.get('password') != confirm_pwd:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def validate_username(self, value):
        from django.conf import settings
        clean_user = value.strip()
        require_otp = getattr(settings, 'AUTH_REQUIRE_EMAIL_VERIFICATION', False)
        
        user = User.objects.filter(username__iexact=clean_user).first()
        if user:
            if not require_otp:
                raise serializers.ValidationError("This username is already taken. Please choose another.")
            elif getattr(user, 'profile', None) and user.profile.email_verified and user.profile.status == 'ACTIVE':
                raise serializers.ValidationError("This username is already taken by an active account. Please choose another.")
        return clean_user

    def validate_email(self, value):
        from django.conf import settings
        clean_email = value.strip().lower()
        if not clean_email:
            raise serializers.ValidationError("Valid email address is required.")
        
        require_otp = getattr(settings, 'AUTH_REQUIRE_EMAIL_VERIFICATION', False)
        user = User.objects.filter(email__iexact=clean_email).first()
        if user:
            if not require_otp:
                raise serializers.ValidationError("An account with this email already exists. Please sign in instead.")
            elif getattr(user, 'profile', None) and user.profile.email_verified and user.profile.status == 'ACTIVE':
                raise serializers.ValidationError("An account with this email is already verified. Please sign in instead.")
        return clean_email

    def create(self, validated_data):
        from django.conf import settings
        require_otp = getattr(settings, 'AUTH_REQUIRE_EMAIL_VERIFICATION', False)

        validated_data.pop('confirm_password', None)
        currency = validated_data.pop('currency', 'INR')
        monthly_income = validated_data.pop('monthly_income', 75000.00)
        phone_number = validated_data.pop('phone_number', '')
        password = validated_data.pop('password')
        username = validated_data['username'].strip()
        email = validated_data.get('email', '').strip().lower()

        if require_otp:
            # Clean up abandoned unverified accounts so credentials can be re-attempted
            unverified_users = User.objects.filter(
                (Q(username__iexact=username) | Q(email__iexact=email)),
                profile__email_verified=False
            )
            unverified_users.delete()

        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=password,
            is_active=not require_otp
        )

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.currency = currency
        profile.monthly_income = monthly_income
        profile.phone_number = phone_number
        profile.status = 'PENDING_VERIFICATION' if require_otp else 'ACTIVE'
        profile.email_verified = False
        profile.is_verified = not require_otp
        profile.save()
        return user

class VerificationCheckSerializer(serializers.Serializer):
    verification_id = serializers.UUIDField(required=True)
    code = serializers.CharField(required=True, min_length=4, max_length=10)

class VerificationResendSerializer(serializers.Serializer):
    verification_id = serializers.UUIDField(required=True)

class VerificationSendSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField(required=True, allow_blank=False)

class GoogleLinkAccountSerializer(serializers.Serializer):
    credential = serializers.CharField(required=True, allow_blank=False)
    password = serializers.CharField(required=True, write_only=True, allow_blank=False)

