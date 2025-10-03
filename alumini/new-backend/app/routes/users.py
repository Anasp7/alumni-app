from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import get_engine
from sqlalchemy import text

bp = Blueprint("users", __name__)


@bp.get("/")
def list_users():
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, name, role, graduation_year, major, company, position, bio, skills
                FROM users ORDER BY name
            """))
            
            users = []
            for row in result:
                users.append({
                    "id": row.id,
                    "name": row.name,
                    "role": row.role,
                    "graduation_year": row.graduation_year,
                    "major": row.major,
                    "company": row.company,
                    "position": row.position,
                    "bio": row.bio,
                    "skills": row.skills
                })
            
            return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.get("/alumni")
def list_alumni():
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, name, graduation_year, major, company, position, bio, skills
                FROM users WHERE role = 'alumni' ORDER BY name
            """))
            
            alumni = []
            for row in result:
                alumni.append({
                    "id": row.id,
                    "name": row.name,
                    "graduation_year": row.graduation_year,
                    "major": row.major,
                    "company": row.company,
                    "position": row.position,
                    "bio": row.bio,
                    "skills": row.skills
                })
            
            return jsonify(alumni), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.get("/students")
def list_students():
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, name, graduation_year, major, bio, skills
                FROM users WHERE role = 'student' ORDER BY name
            """))
            
            students = []
            for row in result:
                students.append({
                    "id": row.id,
                    "name": row.name,
                    "graduation_year": row.graduation_year,
                    "major": row.major,
                    "bio": row.bio,
                    "skills": row.skills
                })
            
            return jsonify(students), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.get("/<int:user_id>")
def get_user(user_id):
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, name, role, graduation_year, major, company, position, bio, skills
                FROM users WHERE id = :user_id
            """), {"user_id": user_id})
            
            user = result.fetchone()
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            return jsonify({
                "id": user.id,
                "name": user.name,
                "role": user.role,
                "graduation_year": user.graduation_year,
                "major": user.major,
                "company": user.company,
                "position": user.position,
                "bio": user.bio,
                "skills": user.skills
            }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.put("/profile")
@jwt_required()
def update_profile():
    current_user = get_jwt_identity()
    data = request.get_json()
    
    engine = get_engine()
    try:
        with engine.connect() as conn:
            conn.execute(text("""
                UPDATE users SET 
                    name = :name, graduation_year = :graduation_year, major = :major,
                    company = :company, position = :position, bio = :bio, skills = :skills
                WHERE id = :user_id
            """), {
                "user_id": current_user["id"],
                "name": data.get("name", current_user["name"]),
                "graduation_year": data.get("graduation_year"),
                "major": data.get("major"),
                "company": data.get("company"),
                "position": data.get("position"),
                "bio": data.get("bio"),
                "skills": data.get("skills")
            })
            conn.commit()
            
            return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


