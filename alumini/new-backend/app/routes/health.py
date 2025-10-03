from flask import Blueprint, jsonify
from ..models import ping_db


bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    try:
        ping_db()
        return jsonify({"status": "ok", "db": "ok"})
    except Exception as exc:  # pragma: no cover
        return jsonify({"status": "degraded", "error": str(exc)}), 500


