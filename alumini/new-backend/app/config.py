import os


def get_config():
    db = {
        "host": os.getenv("DB_HOST", "db"),
        "port": os.getenv("DB_PORT", "3306"),
        "user": os.getenv("DB_USER", "alumni_user"),
        "password": os.getenv("DB_PASSWORD", "alumni_pass"),
        "name": os.getenv("DB_NAME", "alumni_connect"),
    }

    return {
        "SQLALCHEMY_DATABASE_URI": f"mysql+pymysql://{db['user']}:{db['password']}@{db['host']}:{db['port']}/{db['name']}",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "SECRET_KEY": os.getenv("SECRET_KEY", "dev-secret"),
        "JWT_SECRET_KEY": os.getenv("JWT_SECRET_KEY", "jwt-secret"),
        # Bootstrap admin credential (single admin account)
        "ADMIN_EMAIL": os.getenv("ADMIN_EMAIL", "admin@alumni.local"),
        "ADMIN_PASSWORD": os.getenv("ADMIN_PASSWORD", "ChangeMe123!"),
    }


