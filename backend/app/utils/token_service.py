"""
Token service for generating and verifying JWT tokens for external examiner access
"""
import jwt
from datetime import datetime, timedelta
from flask import current_app

class TokenService:
    """Service for generating and verifying JWT tokens"""

    @staticmethod
    def generate_examiner_token(thesis_id, examiner_id, expiry_days=90):
        """
        Generate JWT token for examiner report submission

        Args:
            thesis_id (int): ID of the thesis
            examiner_id (int): ID of the examiner
            expiry_days (int): Token validity in days (default 90)

        Returns:
            str: JWT token
        """
        try:
            payload = {
                'thesis_id': thesis_id,
                'examiner_id': examiner_id,
                'exp': datetime.utcnow() + timedelta(days=expiry_days),
                'iat': datetime.utcnow(),
                'type': 'examiner_access'
            }

            token = jwt.encode(
                payload,
                current_app.config['SECRET_KEY'],
                algorithm='HS256'
            )

            return token
        except Exception as e:
            print(f"Error generating examiner token: {e}")
            return None

    @staticmethod
    def verify_examiner_token(token):
        """
        Verify and decode examiner token

        Args:
            token (str): JWT token to verify

        Returns:
            dict: Decoded payload with thesis_id and examiner_id, or None if invalid
        """
        try:
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )

            # Verify token type
            if payload.get('type') != 'examiner_access':
                return None

            return {
                'thesis_id': payload.get('thesis_id'),
                'examiner_id': payload.get('examiner_id')
            }
        except jwt.ExpiredSignatureError:
            print("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"Invalid token: {e}")
            return None
        except Exception as e:
            print(f"Error verifying token: {e}")
            return None

    @staticmethod
    def generate_thesis_download_token(thesis_id, expiry_days=90):
        """
        Generate token for thesis PDF download (public access)

        Args:
            thesis_id (int): ID of the thesis
            expiry_days (int): Token validity in days (default 90)

        Returns:
            str: JWT token
        """
        try:
            payload = {
                'thesis_id': thesis_id,
                'exp': datetime.utcnow() + timedelta(days=expiry_days),
                'iat': datetime.utcnow(),
                'type': 'thesis_download'
            }

            token = jwt.encode(
                payload,
                current_app.config['SECRET_KEY'],
                algorithm='HS256'
            )

            return token
        except Exception as e:
            print(f"Error generating download token: {e}")
            return None

    @staticmethod
    def verify_thesis_download_token(token):
        """
        Verify and decode thesis download token

        Args:
            token (str): JWT token to verify

        Returns:
            dict: Decoded payload with thesis_id, or None if invalid
        """
        try:
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )

            # Verify token type
            if payload.get('type') != 'thesis_download':
                return None

            return {
                'thesis_id': payload.get('thesis_id')
            }
        except jwt.ExpiredSignatureError:
            print("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"Invalid token: {e}")
            return None
        except Exception as e:
            print(f"Error verifying token: {e}")
            return None

    @staticmethod
    def generate_examiner_invitation_tokens(thesis_id, examiner_ids):
        """
        Generate tokens for multiple examiners at once

        Args:
            thesis_id (int): ID of the thesis
            examiner_ids (list): List of examiner IDs

        Returns:
            dict: Dictionary mapping examiner_id to token
        """
        tokens = {}
        for examiner_id in examiner_ids:
            token = TokenService.generate_examiner_token(thesis_id, examiner_id)
            if token:
                tokens[examiner_id] = token
        return tokens
