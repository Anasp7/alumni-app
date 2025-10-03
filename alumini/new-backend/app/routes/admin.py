from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from ..models import get_engine
from sqlalchemy import text

bp = Blueprint("admin", __name__)


def get_current_user():
    """Get current user from JWT claims"""
    claims = get_jwt()
    return claims


def require_admin(current_user):
    """Helper to verify admin role"""
    if current_user.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    return None


@bp.get("/users")
@jwt_required()
def list_all_users():
    """Get all users with their roles and activity counts"""
    current_user = get_current_user()
    error = require_admin(current_user)
    if error:
        return error
    
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    u.id, u.email, u.name, u.role, u.created_at,
                    u.graduation_year, u.major, u.company, u.position,
                    (SELECT COUNT(*) FROM stories WHERE author_id = u.id) as story_count,
                    (SELECT COUNT(*) FROM opportunities WHERE posted_by = u.id) as opportunity_count,
                    (SELECT COUNT(*) FROM scholarships WHERE posted_by = u.id) as scholarship_count,
                    (SELECT COUNT(*) FROM mentorship_requests WHERE student_id = u.id OR mentor_id = u.id) as mentorship_count,
                    (SELECT COUNT(*) FROM messages WHERE sender_id = u.id OR receiver_id = u.id) as message_count,
                    (SELECT COUNT(*) FROM applications WHERE applicant_id = u.id) as application_count
                FROM users u
                ORDER BY u.created_at DESC
            """))
            
            users = []
            for row in result:
                users.append({
                    "id": row.id,
                    "email": row.email,
                    "name": row.name,
                    "role": row.role,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "graduation_year": row.graduation_year,
                    "major": row.major,
                    "company": row.company,
                    "position": row.position,
                    "stats": {
                        "stories": row.story_count,
                        "opportunities": row.opportunity_count,
                        "scholarships": row.scholarship_count,
                        "mentorships": row.mentorship_count,
                        "messages": row.message_count,
                        "applications": row.application_count
                    }
                })
            
            return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.delete("/users/<int:user_id>")
@jwt_required()
def kick_user(user_id):
    """
    Kick a user and delete all their associated data:
    - Stories authored by the user
    - Opportunities posted by the user
    - Scholarships posted by the user
    - Mentorship requests (as student or mentor)
    - Messages sent or received
    - Applications submitted
    - Finally, delete the user account
    """
    current_user = get_current_user()
    error = require_admin(current_user)
    if error:
        return error
    
    engine = get_engine()
    try:
        with engine.connect() as conn:
            # Check if user exists
            user_result = conn.execute(text("""
                SELECT id, email, name, role FROM users WHERE id = :user_id
            """), {"user_id": user_id})
            
            user = user_result.fetchone()
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Track what we're deleting
            deleted_items = {
                "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role},
                "stories": 0,
                "opportunities": 0,
                "scholarships": 0,
                "mentorship_requests": 0,
                "messages": 0,
                "applications": 0
            }
            
            # Delete stories authored by user
            result = conn.execute(text("""
                DELETE FROM stories WHERE author_id = :user_id
            """), {"user_id": user_id})
            deleted_items["stories"] = result.rowcount
            
            # Delete opportunities posted by user
            result = conn.execute(text("""
                DELETE FROM opportunities WHERE posted_by = :user_id
            """), {"user_id": user_id})
            deleted_items["opportunities"] = result.rowcount
            
            # Delete scholarships posted by user
            result = conn.execute(text("""
                DELETE FROM scholarships WHERE posted_by = :user_id
            """), {"user_id": user_id})
            deleted_items["scholarships"] = result.rowcount
            
            # Delete mentorship requests (as student or mentor)
            result = conn.execute(text("""
                DELETE FROM mentorship_requests 
                WHERE student_id = :user_id OR mentor_id = :user_id
            """), {"user_id": user_id})
            deleted_items["mentorship_requests"] = result.rowcount
            
            # Delete messages (sent or received)
            result = conn.execute(text("""
                DELETE FROM messages 
                WHERE sender_id = :user_id OR receiver_id = :user_id
            """), {"user_id": user_id})
            deleted_items["messages"] = result.rowcount
            
            # Delete applications
            result = conn.execute(text("""
                DELETE FROM applications WHERE applicant_id = :user_id
            """), {"user_id": user_id})
            deleted_items["applications"] = result.rowcount
            
            # Finally, delete the user
            conn.execute(text("""
                DELETE FROM users WHERE id = :user_id
            """), {"user_id": user_id})
            
            conn.commit()
            
            return jsonify({
                "message": f"User {user.name} ({user.email}) has been kicked successfully",
                "deleted": deleted_items
            }), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.get("/students")
@jwt_required()
def list_students():
    """Get all students with their activity counts"""
    current_user = get_current_user()
    error = require_admin(current_user)
    if error:
        return error
    
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    u.id, u.email, u.name, u.created_at,
                    u.graduation_year, u.major, u.bio, u.skills,
                    (SELECT COUNT(*) FROM stories WHERE author_id = u.id) as story_count,
                    (SELECT COUNT(*) FROM mentorship_requests WHERE student_id = u.id) as mentorship_count,
                    (SELECT COUNT(*) FROM messages WHERE sender_id = u.id OR receiver_id = u.id) as message_count,
                    (SELECT COUNT(*) FROM applications WHERE applicant_id = u.id) as application_count
                FROM users u
                WHERE u.role = 'student'
                ORDER BY u.created_at DESC
            """))
            
            students = []
            for row in result:
                students.append({
                    "id": row.id,
                    "email": row.email,
                    "name": row.name,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "graduation_year": row.graduation_year,
                    "major": row.major,
                    "bio": row.bio,
                    "skills": row.skills,
                    "stats": {
                        "stories": row.story_count,
                        "mentorships": row.mentorship_count,
                        "messages": row.message_count,
                        "applications": row.application_count
                    }
                })
            
            return jsonify(students), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.get("/alumni")
@jwt_required()
def list_alumni():
    """Get all alumni with their activity counts"""
    current_user = get_current_user()
    error = require_admin(current_user)
    if error:
        return error
    
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    u.id, u.email, u.name, u.created_at,
                    u.graduation_year, u.major, u.company, u.position, u.bio, u.skills,
                    (SELECT COUNT(*) FROM stories WHERE author_id = u.id) as story_count,
                    (SELECT COUNT(*) FROM opportunities WHERE posted_by = u.id) as opportunity_count,
                    (SELECT COUNT(*) FROM scholarships WHERE posted_by = u.id) as scholarship_count,
                    (SELECT COUNT(*) FROM mentorship_requests WHERE mentor_id = u.id) as mentorship_count,
                    (SELECT COUNT(*) FROM messages WHERE sender_id = u.id OR receiver_id = u.id) as message_count
                FROM users u
                WHERE u.role = 'alumni'
                ORDER BY u.created_at DESC
            """))
            
            alumni = []
            for row in result:
                alumni.append({
                    "id": row.id,
                    "email": row.email,
                    "name": row.name,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "graduation_year": row.graduation_year,
                    "major": row.major,
                    "company": row.company,
                    "position": row.position,
                    "bio": row.bio,
                    "skills": row.skills,
                    "stats": {
                        "stories": row.story_count,
                        "opportunities": row.opportunity_count,
                        "scholarships": row.scholarship_count,
                        "mentorships": row.mentorship_count,
                        "messages": row.message_count
                    }
                })
            
            return jsonify(alumni), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.get("/stats")
@jwt_required()
def get_platform_stats():
    """Get overall platform statistics"""
    current_user = get_current_user()
    error = require_admin(current_user)
    if error:
        return error
    
    engine = get_engine()
    try:
        with engine.connect() as conn:
            # Get counts for each entity
            stats = {}
            
            # User counts by role
            result = conn.execute(text("""
                SELECT role, COUNT(*) as count FROM users GROUP BY role
            """))
            stats["users_by_role"] = {row.role: row.count for row in result}
            
            # Total counts
            result = conn.execute(text("SELECT COUNT(*) as count FROM stories"))
            stats["total_stories"] = result.fetchone().count
            
            result = conn.execute(text("SELECT COUNT(*) as count FROM opportunities"))
            stats["total_opportunities"] = result.fetchone().count
            
            result = conn.execute(text("SELECT COUNT(*) as count FROM scholarships"))
            stats["total_scholarships"] = result.fetchone().count
            
            result = conn.execute(text("SELECT COUNT(*) as count FROM mentorship_requests"))
            stats["total_mentorship_requests"] = result.fetchone().count
            
            result = conn.execute(text("SELECT COUNT(*) as count FROM messages"))
            stats["total_messages"] = result.fetchone().count
            
            result = conn.execute(text("SELECT COUNT(*) as count FROM applications"))
            stats["total_applications"] = result.fetchone().count
            
            return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
