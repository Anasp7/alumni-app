from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from ..models import get_engine
from ..auth_helpers import get_current_user
from sqlalchemy import text

bp = Blueprint("opportunities", __name__)


@bp.get("/")
def list_opportunities():
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT o.id, o.title, o.company, o.description, o.requirements, 
                       o.location, o.salary_range, o.type, o.created_at,
                       u.name as posted_by_name
                FROM opportunities o
                LEFT JOIN users u ON o.posted_by = u.id
                WHERE o.is_active = TRUE
                ORDER BY o.created_at DESC
            """))
            
            opportunities = []
            for row in result:
                opportunities.append({
                    "id": row.id,
                    "title": row.title,
                    "company": row.company,
                    "description": row.description,
                    "requirements": row.requirements,
                    "location": row.location,
                    "salary_range": row.salary_range,
                    "type": row.type,
                    "posted_by_name": row.posted_by_name,
                    "created_at": row.created_at.isoformat() if row.created_at else None
                })
            
            return jsonify(opportunities), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.post("/")
@jwt_required()
def create_opportunity():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "User not found"}), 404
        
    data = request.get_json()
    
    if current_user["role"] != "alumni":
        return jsonify({"error": "Only alumni can post opportunities"}), 403
    
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                INSERT INTO opportunities (title, company, description, requirements, 
                                        location, salary_range, type, posted_by)
                VALUES (:title, :company, :description, :requirements, 
                       :location, :salary_range, :type, :posted_by)
            """), {
                "title": data["title"],
                "company": data["company"],
                "description": data.get("description"),
                "requirements": data.get("requirements"),
                "location": data.get("location"),
                "salary_range": data.get("salary_range"),
                "type": data["type"],
                "posted_by": current_user["id"]
            })
            conn.commit()
            
            return jsonify({"message": "Opportunity created successfully", "id": result.lastrowid}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.get("/<int:opportunity_id>")
def get_opportunity(opportunity_id):
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT o.id, o.title, o.company, o.description, o.requirements, 
                       o.location, o.salary_range, o.type, o.created_at,
                       u.name as posted_by_name, u.email as posted_by_email
                FROM opportunities o
                LEFT JOIN users u ON o.posted_by = u.id
                WHERE o.id = :opportunity_id AND o.is_active = TRUE
            """), {"opportunity_id": opportunity_id})
            
            opportunity = result.fetchone()
            if not opportunity:
                return jsonify({"error": "Opportunity not found"}), 404
            
            return jsonify({
                "id": opportunity.id,
                "title": opportunity.title,
                "company": opportunity.company,
                "description": opportunity.description,
                "requirements": opportunity.requirements,
                "location": opportunity.location,
                "salary_range": opportunity.salary_range,
                "type": opportunity.type,
                "posted_by_name": opportunity.posted_by_name,
                "posted_by_email": opportunity.posted_by_email,
                "created_at": opportunity.created_at.isoformat() if opportunity.created_at else None
            }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


