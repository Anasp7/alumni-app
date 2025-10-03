from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import get_engine
from ..auth_helpers import get_current_user
from sqlalchemy import text
import json

bp = Blueprint("scholarships", __name__)


def check_eligibility(conn, user_id, scholarship):
    """Check if a student is eligible for a scholarship"""
    try:
        user_result = conn.execute(text("""
            SELECT cgpa, reservation_category, is_lateral_entry, graduation_year, major
            FROM users WHERE id = :user_id
        """), {"user_id": user_id})
        user = user_result.fetchone()
        
        if not user:
            return False
        
        # Check CGPA
        if scholarship.min_cgpa and user.cgpa and user.cgpa < scholarship.min_cgpa:
            return False
        
        # Check reservation category
        if scholarship.reservation_category and scholarship.reservation_category != "All":
            if user.reservation_category and scholarship.reservation_category != user.reservation_category:
                return False
        
        # Check lateral entry
        if not scholarship.lateral_entry_allowed and user.is_lateral_entry:
            return False
        
        # Check eligible years
        if scholarship.eligible_years:
            try:
                eligible_years = json.loads(scholarship.eligible_years) if isinstance(scholarship.eligible_years, str) else scholarship.eligible_years
                if eligible_years and user.graduation_year and str(user.graduation_year) not in eligible_years:
                    return False
            except:
                pass
        
        # Check eligible majors
        if scholarship.eligible_majors:
            try:
                eligible_majors = json.loads(scholarship.eligible_majors) if isinstance(scholarship.eligible_majors, str) else scholarship.eligible_majors
                if eligible_majors and user.major and user.major not in eligible_majors:
                    return False
            except:
                pass
        
        return True
    except Exception as e:
        print(f"Eligibility check error: {e}")
        return False


@bp.route("/", methods=["GET"])
def list_scholarships():
    try:
        engine = get_engine()
        
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT s.id, s.title, s.description, s.amount, s.deadline, 
                       s.requirements, s.min_cgpa, s.reservation_category,
                       s.lateral_entry_allowed, s.eligible_years, s.eligible_majors,
                       s.other_criteria, s.posted_by, s.created_at, s.updated_at,
                       u.name as posted_by_name
                FROM scholarships s
                LEFT JOIN users u ON s.posted_by = u.id
                WHERE s.is_active = TRUE
                ORDER BY s.deadline ASC
            """))
            
            scholarships = []
            for row in result:
                scholarship = {
                    "id": row.id,
                    "title": row.title,
                    "description": row.description,
                    "amount": float(row.amount) if row.amount else None,
                    "deadline": row.deadline.isoformat() if row.deadline else None,
                    "requirements": row.requirements,
                    "min_cgpa": float(row.min_cgpa) if row.min_cgpa else None,
                    "reservation_category": row.reservation_category,
                    "lateral_entry_allowed": row.lateral_entry_allowed,
                    "eligible_years": json.loads(row.eligible_years) if row.eligible_years else [],
                    "eligible_majors": json.loads(row.eligible_majors) if row.eligible_majors else [],
                    "other_criteria": row.other_criteria,
                    "posted_by": row.posted_by,
                    "posted_by_name": row.posted_by_name,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                    "is_eligible": True  # Will be checked on apply
                }
                
                scholarships.append(scholarship)
            
            return jsonify(scholarships), 200
    except Exception as e:
        print(f"Error listing scholarships: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/", methods=["POST"])
@jwt_required()
def create_scholarship():
    print("=== CREATE SCHOLARSHIP CALLED ===")
    try:
        print("Getting current user...")
        current_user = get_current_user()
        print(f"Current user: {current_user}")
        
        if not current_user:
            print("User not found!")
            return jsonify({"error": "User not found"}), 404
            
        data = request.get_json()
        print(f"Request data: {data}")
        
        if current_user["role"] != "alumni":
            print(f"User role {current_user['role']} is not alumni")
            return jsonify({"error": "Only alumni can post scholarships"}), 403
        
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(text("""
                INSERT INTO scholarships (
                    title, description, amount, deadline, requirements,
                    min_cgpa, reservation_category, lateral_entry_allowed,
                    eligible_years, eligible_majors, other_criteria, posted_by
                )
                VALUES (
                    :title, :description, :amount, :deadline, :requirements,
                    :min_cgpa, :reservation_category, :lateral_entry_allowed,
                    :eligible_years, :eligible_majors, :other_criteria, :posted_by
                )
            """), {
                "title": data["title"],
                "description": data.get("description"),
                "amount": data.get("amount"),
                "deadline": data.get("deadline"),
                "requirements": data.get("requirements"),
                "min_cgpa": data.get("min_cgpa"),
                "reservation_category": data.get("reservation_category"),
                "lateral_entry_allowed": data.get("lateral_entry_allowed", True),
                "eligible_years": json.dumps(data.get("eligible_years", [])),
                "eligible_majors": json.dumps(data.get("eligible_majors", [])),
                "other_criteria": data.get("other_criteria"),
                "posted_by": current_user["id"]
            })
            conn.commit()
            
            return jsonify({"message": "Scholarship created successfully", "id": result.lastrowid}), 201
    except Exception as e:
        print(f"Error creating scholarship: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/<int:scholarship_id>", methods=["GET"])
@jwt_required()
def get_scholarship(scholarship_id):
    try:
        current_user = get_jwt_identity()
        engine = get_engine()
        
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT s.*, u.name as posted_by_name, u.email as posted_by_email
                FROM scholarships s
                LEFT JOIN users u ON s.posted_by = u.id
                WHERE s.id = :scholarship_id AND s.is_active = TRUE
            """), {"scholarship_id": scholarship_id})
            
            row = result.fetchone()
            if not row:
                return jsonify({"error": "Scholarship not found"}), 404
            
            scholarship = {
                "id": row.id,
                "title": row.title,
                "description": row.description,
                "amount": float(row.amount) if row.amount else None,
                "deadline": row.deadline.isoformat() if row.deadline else None,
                "requirements": row.requirements,
                "min_cgpa": float(row.min_cgpa) if row.min_cgpa else None,
                "reservation_category": row.reservation_category,
                "lateral_entry_allowed": row.lateral_entry_allowed,
                "eligible_years": json.loads(row.eligible_years) if row.eligible_years else [],
                "eligible_majors": json.loads(row.eligible_majors) if row.eligible_majors else [],
                "other_criteria": row.other_criteria,
                "posted_by": row.posted_by,
                "posted_by_name": row.posted_by_name,
                "posted_by_email": row.posted_by_email,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None
            }
            
            if current_user.get("role") == "student":
                scholarship["is_eligible"] = check_eligibility(conn, current_user.get("id"), row)
            
            return jsonify(scholarship), 200
    except Exception as e:
        print(f"Error getting scholarship: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/<int:scholarship_id>", methods=["PUT"])
@jwt_required()
def update_scholarship(scholarship_id):
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        if current_user.get("role") != "alumni":
            return jsonify({"error": "Only alumni can update scholarships"}), 403
        
        engine = get_engine()
        with engine.connect() as conn:
            # Check if user owns this scholarship
            check = conn.execute(text("""
                SELECT posted_by FROM scholarships WHERE id = :id
            """), {"id": scholarship_id})
            scholarship = check.fetchone()
            
            if not scholarship:
                return jsonify({"error": "Scholarship not found"}), 404
            
            if scholarship.posted_by != current_user.get("id"):
                return jsonify({"error": "You can only update your own scholarships"}), 403
            
            conn.execute(text("""
                UPDATE scholarships SET
                    title = :title,
                    description = :description,
                    amount = :amount,
                    deadline = :deadline,
                    requirements = :requirements,
                    min_cgpa = :min_cgpa,
                    reservation_category = :reservation_category,
                    lateral_entry_allowed = :lateral_entry_allowed,
                    eligible_years = :eligible_years,
                    eligible_majors = :eligible_majors,
                    other_criteria = :other_criteria
                WHERE id = :id
            """), {
                "id": scholarship_id,
                "title": data["title"],
                "description": data.get("description"),
                "amount": data.get("amount"),
                "deadline": data.get("deadline"),
                "requirements": data.get("requirements"),
                "min_cgpa": data.get("min_cgpa"),
                "reservation_category": data.get("reservation_category"),
                "lateral_entry_allowed": data.get("lateral_entry_allowed", True),
                "eligible_years": json.dumps(data.get("eligible_years", [])),
                "eligible_majors": json.dumps(data.get("eligible_majors", [])),
                "other_criteria": data.get("other_criteria")
            })
            conn.commit()
            
            return jsonify({"message": "Scholarship updated successfully"}), 200
    except Exception as e:
        print(f"Error updating scholarship: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/<int:scholarship_id>", methods=["DELETE"])
@jwt_required()
def delete_scholarship(scholarship_id):
    try:
        current_user = get_jwt_identity()
        engine = get_engine()
        
        with engine.connect() as conn:
            # Check if user owns this scholarship or is admin
            check = conn.execute(text("""
                SELECT posted_by FROM scholarships WHERE id = :id
            """), {"id": scholarship_id})
            scholarship = check.fetchone()
            
            if not scholarship:
                return jsonify({"error": "Scholarship not found"}), 404
            
            # Alumni can delete their own, admin can delete any
            if current_user.get("role") == "alumni" and scholarship.posted_by != current_user.get("id"):
                return jsonify({"error": "You can only delete your own scholarships"}), 403
            
            if current_user.get("role") not in ["alumni", "admin"]:
                return jsonify({"error": "Unauthorized"}), 403
            
            conn.execute(text("""
                UPDATE scholarships SET is_active = FALSE WHERE id = :id
            """), {"id": scholarship_id})
            conn.commit()
            
            return jsonify({"message": "Scholarship deleted successfully"}), 200
    except Exception as e:
        print(f"Error deleting scholarship: {e}")
        return jsonify({"error": str(e)}), 500


@bp.route("/<int:scholarship_id>/apply", methods=["POST"])
@jwt_required()
def apply_scholarship(scholarship_id):
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        if current_user.get("role") != "student":
            return jsonify({"error": "Only students can apply for scholarships"}), 403
        
        engine = get_engine()
        with engine.connect() as conn:
            # Check if scholarship exists and is active
            scholarship_check = conn.execute(text("""
                SELECT * FROM scholarships WHERE id = :id AND is_active = TRUE
            """), {"id": scholarship_id})
            scholarship = scholarship_check.fetchone()
            
            if not scholarship:
                return jsonify({"error": "Scholarship not found or inactive"}), 404
            
            # Check eligibility
            if not check_eligibility(conn, current_user.get("id"), scholarship):
                return jsonify({"error": "You are not eligible for this scholarship"}), 403
            
            # Check if already applied
            existing = conn.execute(text("""
                SELECT id FROM applications 
                WHERE applicant_id = :user_id AND scholarship_id = :scholarship_id
            """), {"user_id": current_user.get("id"), "scholarship_id": scholarship_id})
            
            if existing.fetchone():
                return jsonify({"error": "You have already applied for this scholarship"}), 400
            
            # Create application
            conn.execute(text("""
                INSERT INTO applications (
                    applicant_id, scholarship_id, type, cover_letter, document_urls
                )
                VALUES (:applicant_id, :scholarship_id, 'scholarship', :cover_letter, :document_urls)
            """), {
                "applicant_id": current_user.get("id"),
                "scholarship_id": scholarship_id,
                "cover_letter": data.get("cover_letter"),
                "document_urls": json.dumps(data.get("document_urls", []))
            })
            conn.commit()
            
            return jsonify({"message": "Application submitted successfully"}), 201
    except Exception as e:
        print(f"Error applying for scholarship: {e}")
        return jsonify({"error": str(e)}), 500
