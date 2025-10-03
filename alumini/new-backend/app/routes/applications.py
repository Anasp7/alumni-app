from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import get_engine
from sqlalchemy import text

bp = Blueprint("applications", __name__)


@bp.get("/")
@jwt_required()
def list_applications():
    current_user = get_jwt_identity()
    engine = get_engine()
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT a.id, a.type, a.status, a.cover_letter, a.created_at,
                       o.title as opportunity_title, o.company as opportunity_company,
                       s.title as scholarship_title, s.amount as scholarship_amount
                FROM applications a
                LEFT JOIN opportunities o ON a.opportunity_id = o.id
                LEFT JOIN scholarships s ON a.scholarship_id = s.id
                WHERE a.applicant_id = :applicant_id
                ORDER BY a.created_at DESC
            """), {"applicant_id": current_user["id"]})
            
            applications = []
            for row in result:
                applications.append({
                    "id": row.id,
                    "type": row.type,
                    "status": row.status,
                    "cover_letter": row.cover_letter,
                    "opportunity_title": row.opportunity_title,
                    "opportunity_company": row.opportunity_company,
                    "scholarship_title": row.scholarship_title,
                    "scholarship_amount": float(row.scholarship_amount) if row.scholarship_amount else None,
                    "created_at": row.created_at.isoformat() if row.created_at else None
                })
            
            return jsonify(applications), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.post("/")
@jwt_required()
def create_application():
    current_user = get_jwt_identity()
    data = request.get_json()
    
    application_type = data.get("type")
    opportunity_id = data.get("opportunity_id")
    scholarship_id = data.get("scholarship_id")
    cover_letter = data.get("cover_letter")
    
    if not application_type or not cover_letter:
        return jsonify({"error": "Type and cover letter are required"}), 400
    
    if application_type == "job" and not opportunity_id:
        return jsonify({"error": "Opportunity ID required for job applications"}), 400
    
    if application_type == "scholarship" and not scholarship_id:
        return jsonify({"error": "Scholarship ID required for scholarship applications"}), 400
    
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                INSERT INTO applications (applicant_id, opportunity_id, scholarship_id, type, cover_letter)
                VALUES (:applicant_id, :opportunity_id, :scholarship_id, :type, :cover_letter)
            """), {
                "applicant_id": current_user["id"],
                "opportunity_id": opportunity_id,
                "scholarship_id": scholarship_id,
                "type": application_type,
                "cover_letter": cover_letter
            })
            conn.commit()
            
            return jsonify({
                "message": "Application submitted successfully",
                "id": result.lastrowid
            }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.get("/<int:application_id>")
@jwt_required()
def get_application(application_id):
    current_user = get_jwt_identity()
    engine = get_engine()
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT a.id, a.type, a.status, a.cover_letter, a.created_at,
                       o.title as opportunity_title, o.company as opportunity_company,
                       s.title as scholarship_title, s.amount as scholarship_amount
                FROM applications a
                LEFT JOIN opportunities o ON a.opportunity_id = o.id
                LEFT JOIN scholarships s ON a.scholarship_id = s.id
                WHERE a.id = :application_id AND a.applicant_id = :applicant_id
            """), {"application_id": application_id, "applicant_id": current_user["id"]})
            
            application = result.fetchone()
            if not application:
                return jsonify({"error": "Application not found"}), 404
            
            return jsonify({
                "id": application.id,
                "type": application.type,
                "status": application.status,
                "cover_letter": application.cover_letter,
                "opportunity_title": application.opportunity_title,
                "opportunity_company": application.opportunity_company,
                "scholarship_title": application.scholarship_title,
                "scholarship_amount": float(application.scholarship_amount) if application.scholarship_amount else None,
                "created_at": application.created_at.isoformat() if application.created_at else None
            }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
