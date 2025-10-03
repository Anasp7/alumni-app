from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import get_engine
from sqlalchemy import text

bp = Blueprint("mentorship", __name__)


@bp.get("/")
def list_mentorships():
    engine = get_engine()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT mr.id, mr.subject, mr.message, mr.status, mr.created_at,
                       s.name as student_name, m.name as mentor_name,
                       s.email as student_email, m.email as mentor_email
                FROM mentorship_requests mr
                LEFT JOIN users s ON mr.student_id = s.id
                LEFT JOIN users m ON mr.mentor_id = m.id
                ORDER BY mr.created_at DESC
            """))
            
            mentorships = []
            for row in result:
                mentorships.append({
                    "id": row.id,
                    "subject": row.subject,
                    "message": row.message,
                    "status": row.status,
                    "student_name": row.student_name,
                    "mentor_name": row.mentor_name,
                    "student_email": row.student_email,
                    "mentor_email": row.mentor_email,
                    "created_at": row.created_at.isoformat() if row.created_at else None
                })
            
            return jsonify(mentorships), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.post("/request")
@jwt_required()
def request_mentorship():
    current_user = get_jwt_identity()
    data = request.get_json()
    
    if current_user["role"] != "student":
        return jsonify({"error": "Only students can request mentorship"}), 403
    
    mentor_id = data.get("mentor_id")
    subject = data.get("subject")
    message = data.get("message")
    
    if not mentor_id or not subject:
        return jsonify({"error": "Mentor ID and subject are required"}), 400
    
    engine = get_engine()
    try:
        with engine.connect() as conn:
            # Check if mentor exists and is alumni
            mentor_result = conn.execute(text("""
                SELECT id, name FROM users WHERE id = :mentor_id AND role = 'alumni'
            """), {"mentor_id": mentor_id})
            
            mentor = mentor_result.fetchone()
            if not mentor:
                return jsonify({"error": "Mentor not found"}), 404
            
            # Create mentorship request
            result = conn.execute(text("""
                INSERT INTO mentorship_requests (student_id, mentor_id, subject, message)
                VALUES (:student_id, :mentor_id, :subject, :message)
            """), {
                "student_id": current_user["id"],
                "mentor_id": mentor_id,
                "subject": subject,
                "message": message
            })
            conn.commit()
            
            return jsonify({
                "message": "Mentorship request sent successfully",
                "id": result.lastrowid,
                "mentor_name": mentor.name
            }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.put("/<int:request_id>/status")
@jwt_required()
def update_mentorship_status(request_id):
    current_user = get_jwt_identity()
    data = request.get_json()
    new_status = data.get("status")
    
    if new_status not in ["accepted", "rejected", "completed"]:
        return jsonify({"error": "Invalid status"}), 400
    
    engine = get_engine()
    try:
        with engine.connect() as conn:
            # Check if user is the mentor for this request
            result = conn.execute(text("""
                SELECT mentor_id FROM mentorship_requests WHERE id = :request_id
            """), {"request_id": request_id})
            
            request_data = result.fetchone()
            if not request_data:
                return jsonify({"error": "Mentorship request not found"}), 404
            
            if request_data.mentor_id != current_user["id"]:
                return jsonify({"error": "Unauthorized"}), 403
            
            # Update status
            conn.execute(text("""
                UPDATE mentorship_requests SET status = :status WHERE id = :request_id
            """), {"status": new_status, "request_id": request_id})
            conn.commit()
            
            return jsonify({"message": f"Mentorship request {new_status} successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


