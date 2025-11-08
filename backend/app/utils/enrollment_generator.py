"""
Utility for generating enrollment numbers for scholars
Format: XYYAAA
- X = P (PhD) or M (MSc)
- YY = Last two digits of admission year
- AAA = Serial number (001-999)
"""
from datetime import datetime
from app.models.scholar import Scholar


class EnrollmentGenerator:
    """Generate enrollment numbers for new scholars"""

    @staticmethod
    def generate_enrollment_number(program, admission_year=None):
        """
        Generate enrollment number in format XYYAAA

        Args:
            program: 'PhD' or 'MSc' (or 'M.Sc. (Research)')
            admission_year: Year of admission (defaults to current year)

        Returns:
            str: Generated enrollment number (e.g., 'P25001')
        """
        # Determine program prefix
        if program.upper() in ['PHD', 'PH.D.', 'PH.D']:
            prefix = 'P'
        elif program.upper() in ['MSC', 'M.SC.', 'M.SC. (RESEARCH)', 'MSCRESEARCH']:
            prefix = 'M'
        else:
            raise ValueError(f"Invalid program: {program}. Must be PhD or MSc.")

        # Get year (last 2 digits)
        if admission_year is None:
            admission_year = datetime.now().year

        year_suffix = str(admission_year)[-2:]  # Last 2 digits

        # Find the next available serial number
        # Query all scholars with same program and year
        pattern = f"{prefix}{year_suffix}%"
        existing_enrollments = Scholar.query.filter(
            Scholar.enrollment_number.like(pattern)
        ).order_by(Scholar.enrollment_number.desc()).all()

        # Determine next serial number
        if not existing_enrollments:
            serial = 1
        else:
            # Extract serial number from the most recent enrollment
            latest = existing_enrollments[0].enrollment_number
            try:
                latest_serial = int(latest[-3:])  # Last 3 digits
                serial = latest_serial + 1
            except (ValueError, IndexError):
                serial = 1

        # Ensure serial number doesn't exceed 999
        if serial > 999:
            raise ValueError(f"Maximum enrollment capacity reached for {program} {admission_year}")

        # Format: XYYAAA
        enrollment_number = f"{prefix}{year_suffix}{serial:03d}"

        return enrollment_number

    @staticmethod
    def validate_enrollment_number(enrollment_number):
        """
        Validate enrollment number format

        Args:
            enrollment_number: Enrollment number to validate

        Returns:
            dict: {valid: bool, message: str, program: str, year: int, serial: int}
        """
        if not enrollment_number or len(enrollment_number) != 6:
            return {
                'valid': False,
                'message': 'Enrollment number must be 6 characters long'
            }

        prefix = enrollment_number[0].upper()
        year_part = enrollment_number[1:3]
        serial_part = enrollment_number[3:6]

        # Validate prefix
        if prefix not in ['P', 'M']:
            return {
                'valid': False,
                'message': 'Invalid program prefix. Must be P (PhD) or M (MSc)'
            }

        # Validate year
        try:
            year = int(year_part)
            full_year = 2000 + year if year < 50 else 1900 + year
        except ValueError:
            return {
                'valid': False,
                'message': 'Invalid year format'
            }

        # Validate serial number
        try:
            serial = int(serial_part)
            if serial < 1 or serial > 999:
                return {
                    'valid': False,
                    'message': 'Serial number must be between 001 and 999'
                }
        except ValueError:
            return {
                'valid': False,
                'message': 'Invalid serial number format'
            }

        program = 'PhD' if prefix == 'P' else 'MSc'

        return {
            'valid': True,
            'message': 'Valid enrollment number',
            'program': program,
            'year': full_year,
            'serial': serial,
            'formatted': enrollment_number.upper()
        }

    @staticmethod
    def bulk_generate_enrollment_numbers(scholars_data):
        """
        Generate enrollment numbers for multiple scholars

        Args:
            scholars_data: List of dicts with 'program' and 'admission_year' keys

        Returns:
            list: List of generated enrollment numbers
        """
        enrollment_numbers = []

        for scholar_info in scholars_data:
            program = scholar_info.get('program')
            admission_year = scholar_info.get('admission_year')

            enrollment_number = EnrollmentGenerator.generate_enrollment_number(
                program, admission_year
            )
            enrollment_numbers.append(enrollment_number)

        return enrollment_numbers
