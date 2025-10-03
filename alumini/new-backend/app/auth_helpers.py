from flask_jwt_extended import get_jwt_identity
from .models import get_engine
from sqlalchemy import text


def get_current_user():
    """Get current user data from JWT token"""
    user_id = get_jwt_identity()
    try:
        # IDs were stored as strings in JWT; convert back to int when possible
        user_id = int(user_id)
    except Exception:
        pass
    
    # Handle admin user (id = -1)
    if user_id == -1:
        return {"id": -1, "email": "admin@alumni.local", "name": "Administrator", "role": "admin"}
    
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, email, name, role, graduation_year, major, company, position,
                       cgpa, reservation_category, is_lateral_entry
                FROM users WHERE id = :user_id
            """), {"user_id": user_id})
            
            user = result.fetchone()
            if not user:
                return None
            
            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "graduation_year": user.graduation_year,
                "major": user.major,
                "company": user.company,
                "position": user.position,
                "cgpa": float(user.cgpa) if user.cgpa else None,
                "reservation_category": user.reservation_category,
                "is_lateral_entry": user.is_lateral_entry
            }
    except Exception as e:
        print(f"Error getting current user: {e}")
        return None
