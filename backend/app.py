import os
import sqlite3

from flask import (
    Flask, render_template, request, redirect,
    url_for, session, flash, send_from_directory
)
from werkzeug.security import check_password_hash

# ------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
DATABASE = os.path.join(BASE_DIR, "messages.db")

app = Flask(__name__, template_folder=PROJECT_DIR)

# Set SECRET_KEY as an environment variable in production.
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-this")

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,  # Set True when serving over HTTPS
)


# ------------------------------------------------------------------
# Database
# ------------------------------------------------------------------

def get_db():
    """Open a new SQLite connection with row access by column name."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create the messages table if it doesn't already exist."""
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT NOT NULL DEFAULT 'Unread'
            )
        """)


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def is_admin_logged_in():
    return session.get("admin_logged_in", False)


def validate_contact_form(name, email, subject, message):
    """Return a list of validation error messages, if any."""
    errors = []

    if len(name) < 2:
        errors.append("Name must contain at least 2 characters.")
    if "@" not in email or "." not in email:
        errors.append("Please enter a valid email address.")
    if len(subject) < 3:
        errors.append("Subject must contain at least 3 characters.")
    if len(message) < 10:
        errors.append("Message must contain at least 10 characters.")

    return errors


def admin_required(view_func):
    """Redirect to login if the admin isn't authenticated."""
    from functools import wraps

    @wraps(view_func)
    def wrapper(*args, **kwargs):
        if not is_admin_logged_in():
            return redirect(url_for("login"))
        return view_func(*args, **kwargs)

    return wrapper


# ------------------------------------------------------------------
# Public pages
# ------------------------------------------------------------------

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/about")
def about():
    return render_template("pages/about.html")


@app.route("/projects")
def projects():
    return render_template("pages/projects.html")


@app.route("/resume")
def resume():
    return render_template("pages/resume.html")


# ------------------------------------------------------------------
# Static assets
# ------------------------------------------------------------------

@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory(os.path.join(PROJECT_DIR, "css"), filename)


@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory(os.path.join(PROJECT_DIR, "js"), filename)


@app.route("/assets/<path:filename>")
def serve_assets(filename):
    return send_from_directory(os.path.join(PROJECT_DIR, "assets"), filename)


# ------------------------------------------------------------------
# Contact form
# ------------------------------------------------------------------

@app.route("/contact", methods=["GET", "POST"])
def contact():
    if request.method != "POST":
        return render_template("pages/contact.html")

    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    subject = request.form.get("subject", "").strip()
    message = request.form.get("message", "").strip()

    errors = validate_contact_form(name, email, subject, message)
    if errors:
        return render_template(
            "pages/contact.html",
            errors=errors,
            name=name,
            email=email,
            subject=subject,
            message=message,
        )

    try:
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO messages (name, email, subject, message, status)
                VALUES (?, ?, ?, ?, ?)
                """,
                (name, email, subject, message, "Unread"),
            )
        flash("Your message has been sent successfully!", "success")
    except sqlite3.Error:
        flash("Something went wrong. Please try again later.", "error")

    return redirect(url_for("contact"))


# ------------------------------------------------------------------
# Admin: auth
# ------------------------------------------------------------------

@app.route("/login", methods=["GET", "POST"])
def login():
    if is_admin_logged_in():
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        admin_username = os.environ.get("ADMIN_USERNAME", "admin")

        # Password must be stored as a hash. The fallback below is for
        # local development only — set ADMIN_PASSWORD_HASH in real deployments.
        admin_password_hash = os.environ.get(
            "ADMIN_PASSWORD_HASH",
            "scrypt:32768:8:1$demo$replace-this-password-hash",
        )

        if username == admin_username and check_password_hash(
            admin_password_hash, password
        ):
            session.clear()
            session["admin_logged_in"] = True
            return redirect(url_for("dashboard"))

        flash("Invalid username or password.", "error")

    return render_template("admin/login.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out.", "success")
    return redirect(url_for("login"))


# ------------------------------------------------------------------
# Admin: dashboard
# ------------------------------------------------------------------

@app.route("/dashboard")
@admin_required
def dashboard():
    with get_db() as conn:
        messages = conn.execute(
            "SELECT * FROM messages ORDER BY id DESC"
        ).fetchall()
        total_messages = conn.execute(
            "SELECT COUNT(*) FROM messages"
        ).fetchone()[0]
        unread_messages = conn.execute(
            "SELECT COUNT(*) FROM messages WHERE status = 'Unread'"
        ).fetchone()[0]
        read_messages = conn.execute(
            "SELECT COUNT(*) FROM messages WHERE status = 'Read'"
        ).fetchone()[0]

    return render_template(
        "admin/dashboard.html",
        messages=messages,
        total_messages=total_messages,
        unread_messages=unread_messages,
        read_messages=read_messages,
    )


@app.route("/message/read/<int:message_id>", methods=["POST"])
@admin_required
def mark_as_read(message_id):
    with get_db() as conn:
        conn.execute(
            "UPDATE messages SET status = 'Read' WHERE id = ?",
            (message_id,),
        )
    flash("Message marked as read.", "success")
    return redirect(url_for("dashboard"))


@app.route("/message/delete/<int:message_id>", methods=["POST"])
@admin_required
def delete_message(message_id):
    with get_db() as conn:
        conn.execute("DELETE FROM messages WHERE id = ?", (message_id,))
    flash("Message deleted successfully.", "success")
    return redirect(url_for("dashboard"))


# ------------------------------------------------------------------
# Error handlers
# ------------------------------------------------------------------

@app.errorhandler(404)
def page_not_found(error):
    return render_template("404.html"), 404


@app.errorhandler(500)
def internal_server_error(error):
    return render_template("500.html"), 500


# ------------------------------------------------------------------
# Entry point
# ------------------------------------------------------------------

init_db()

if __name__ == "__main__":
    print("=" * 50)
    print("Sa Em Sromem Portfolio")
    print("=" * 50)
    print("Database: Ready")
    print("Server: http://127.0.0.1:5000")
    print("=" * 50)

    app.run(debug=True, host="127.0.0.1", port=5000)