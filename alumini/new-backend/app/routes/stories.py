from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from ..models import get_engine
from ..auth_helpers import get_current_user
from sqlalchemy import text

bp = Blueprint("stories", __name__)


@bp.get("/")
def list_stories():
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT s.id, s.title, s.content, s.category, s.is_featured, s.created_at,
                       u.name as author_name, u.role as author_role
                FROM stories s
                LEFT JOIN users u ON s.author_id = u.id
                ORDER BY s.is_featured DESC, s.created_at DESC
            """))
            
            stories = []
            for row in result:
                stories.append({
                    "id": row.id,
                    "title": row.title,
                    "content": row.content,
                    "category": row.category,
                    "is_featured": row.is_featured,
                    "author_name": row.author_name,
                    "author_role": row.author_role,
                    "created_at": row.created_at.isoformat() if row.created_at else None
                })
            
            return jsonify(stories), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.post("/")
@jwt_required()
def create_story():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "User not found"}), 404
        
    data = request.get_json()
    
    title = data.get("title")
    content = data.get("content")
    category = data.get("category")
    
    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400
    
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                INSERT INTO stories (author_id, title, content, category)
                VALUES (:author_id, :title, :content, :category)
            """), {
                "author_id": current_user["id"],
                "title": title,
                "content": content,
                "category": category
            })
            conn.commit()
            
            return jsonify({
                "message": "Story created successfully",
                "id": result.lastrowid
            }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.get("/<int:story_id>")
def get_story(story_id):
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT s.id, s.title, s.content, s.category, s.is_featured, s.created_at,
                       u.name as author_name, u.role as author_role, u.bio as author_bio
                FROM stories s
                LEFT JOIN users u ON s.author_id = u.id
                WHERE s.id = :story_id
            """), {"story_id": story_id})
            
            story = result.fetchone()
            if not story:
                return jsonify({"error": "Story not found"}), 404
            
            return jsonify({
                "id": story.id,
                "title": story.title,
                "content": story.content,
                "category": story.category,
                "is_featured": story.is_featured,
                "author_name": story.author_name,
                "author_role": story.author_role,
                "author_bio": story.author_bio,
                "created_at": story.created_at.isoformat() if story.created_at else None
            }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


