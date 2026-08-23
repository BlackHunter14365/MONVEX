"""
MONVEX Verification Provider Abstract Base Interface
Defines the standard contract for managed OTP verification providers (Twilio, Firebase, Console, etc.)
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class ProviderError(Exception):
    def __init__(self, code: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}

class ProviderUnavailableError(ProviderError):
    def __init__(self, message: str = "Verification provider is currently unavailable. Please try again later."):
        super().__init__(code="PROVIDER_UNAVAILABLE", message=message)

class VerificationProvider(ABC):
    """
    Abstract interface for multi-channel transactional verification providers.
    """

    @abstractmethod
    def send_code(self, destination: str, channel: str = "email", metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Requests the provider to generate and dispatch an OTP to destination (email or phone).
        Returns provider payload with status and provider_verification_id.
        """
        pass

    @abstractmethod
    def check_code(self, destination: str, code: str, provider_verification_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Submits code to provider to check validity.
        Returns:
            {"approved": True/False, "status": "approved" | "pending" | "invalid", "provider_status": "..."}
        """
        pass

    @abstractmethod
    def cancel_verification(self, destination: str, provider_verification_id: Optional[str] = None) -> bool:
        """
        Cancels an active verification session if supported by provider.
        """
        pass

    @abstractmethod
    def normalize_provider_error(self, exc: Exception) -> ProviderError:
        """
        Normalizes provider-specific SDK exceptions into standardized ProviderError.
        """
        pass
