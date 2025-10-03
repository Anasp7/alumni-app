from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import get_engine
from sqlalchemy import text

bp = Blueprint("messages", __name__)


@bp.get("/")
@jwt_required()
def list_messages():
    current_user = get_jwt_identity()
    engine = get_engine()
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT m.id, m.subject, m.content, m.is_read, m.created_at,
                       s.name as sender_name, r.name as receiver_name
                FROM messages m
                LEFT JOIN users s ON m.sender_id = s.id
                LEFT JOIN users r ON m.receiver_id = r.id
                WHERE m.receiver_id = :user_id OR m.sender_id = :user_id
                ORDER BY m.created_at DESC
            """), {"user_id": current_user["id"]})
            
            messages = []
            for row in result:
                messages.append({
                    "id": row.id,
                    "subject": row.subject,
                    "content": row.content,
                    "is_read": row.is_read,
                    "sender_name": row.sender_name,
                    "receiver_name": row.receiver_name,
                    "is_from_me": row.sender_name == current_user["name"],
                    "created_at": row.created_at.isoformat() if row.created_at else None
                })
            
            return jsonify(messages), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.post("/")
@jwt_required()
def send_message():
    current_user = get_jwt_identity()
    data = request.get_json()
    
    receiver_id = data.get("receiver_id")
    subject = data.get("subject")
    content = data.get("content")
    
    if not receiver_id or not content:
        return jsonify({"error": "Receiver ID and content are required"}), 400
    
    engine = get_engine()
    try:
        with engine.connect() as conn:
            # Check if receiver exists
            receiver_result = conn.execute(text("""
                SELECT id, name FROM users WHERE id = :receiver_id
            """), {"receiver_id": receiver_id})
            
            receiver = receiver_result.fetchone()
            if not receiver:
                return jsonify({"error": "Receiver not found"}), 404
            
            # Send message
            result = conn.execute(text("""
                INSERT INTO messages (sender_id, receiver_id, subject, content)
                VALUES (:sender_id, :receiver_id, :subject, :content)
            """), {
                "sender_id": current_user["id"],
                "receiver_id": receiver_id,
                "subject": subject,
                "content": content
            })
            conn.commit()
            
            return jsonify({
                "message": "Message sent successfully",
                "id": result.lastrowid,
                "receiver_name": receiver.name
            }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.put("/<int:message_id>/read")
@jwt_required()
def mark_as_read(message_id):
    current_user = get_jwt_identity()
    engine = get_engine()
    
    try:
        with engine.connect() as conn:
            # Check if user is the receiver
            result = conn.execute(text("""
                SELECT receiver_id FROM messages WHERE id = :message_id
            """), {"message_id": message_id})
            
            message = result.fetchone()
            if not message:
                return jsonify({"error": "Message not found"}), 404
            
            if message.receiver_id != current_user["id"]:
                return jsonify({"error": "Unauthorized"}), 403
            
            # Mark as read
            conn.execute(text("""
                UPDATE messages SET is_read = TRUE WHERE id = :message_id
            """), {"message_id": message_id})
            conn.commit()
            
            return jsonify({"message": "Message marked as read"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
