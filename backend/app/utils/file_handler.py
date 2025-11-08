import os
from werkzeug.utils import secure_filename
from flask import current_app
from datetime import datetime

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


def save_uploaded_file(file, subfolder='', custom_filename=None):
    """
    Save uploaded file to the uploads directory

    Args:
        file: FileStorage object from request.files
        subfolder: Optional subfolder within uploads directory
        custom_filename: Optional custom filename (will be sanitized)

    Returns:
        tuple: (relative_path, filename) or (None, None) if error
    """
    if not file or file.filename == '':
        return None, None

    if not allowed_file(file.filename):
        return None, None

    # Generate filename
    if custom_filename:
        filename = secure_filename(custom_filename)
    else:
        # Add timestamp to avoid collisions
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        original_filename = secure_filename(file.filename)
        name, ext = os.path.splitext(original_filename)
        filename = f"{name}_{timestamp}{ext}"

    # Create full path
    upload_folder = current_app.config['UPLOAD_FOLDER']
    if subfolder:
        upload_folder = os.path.join(upload_folder, subfolder)
        os.makedirs(upload_folder, exist_ok=True)

    filepath = os.path.join(upload_folder, filename)

    # Save file
    try:
        file.save(filepath)
        # Return relative path for database storage
        relative_path = os.path.join(subfolder, filename) if subfolder else filename
        return relative_path, filename
    except Exception as e:
        print(f"Error saving file: {e}")
        return None, None


def delete_file(relative_path):
    """
    Delete file from uploads directory

    Args:
        relative_path: Relative path from uploads directory

    Returns:
        bool: True if deleted successfully, False otherwise
    """
    if not relative_path:
        return False

    try:
        upload_folder = current_app.config['UPLOAD_FOLDER']
        full_path = os.path.join(upload_folder, relative_path)

        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False
    except Exception as e:
        print(f"Error deleting file: {e}")
        return False


def get_file_path(relative_path):
    """Get full file path from relative path"""
    upload_folder = current_app.config['UPLOAD_FOLDER']
    return os.path.join(upload_folder, relative_path)
