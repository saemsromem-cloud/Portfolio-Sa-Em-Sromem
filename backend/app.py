from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
    send_from_directory
)
from werkzeug.security import check_password_hash
from datetime import datetime
import sqlite3
import os


# ============================================================
# 1. PROJECT CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)

app = Flask(
    __name__,
    template_folder=PROJECT_DIR
)

# IMPORTANT:
# Set SECRET_KEY as an environment variable in production.
app.secret_key = os.environ.get(
    "SECRET_KEY",
    "dev-secret-key-change-this"
)

# Session security
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,  # Change to True when using HTTPS
)

DATABASE = os.path.join(BASE_DIR, "messages.db")


# ============================================================
# 2. DATABASE
# ============================================================

def get_db():
    """Create and return a SQLite database connection."""
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    """Create the messages table if it doesn't exist."""
    connection = get_db()

    connection.execute("""
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

    connection.commit()
    connection.close()


# ============================================================
# 3. HELPER FUNCTIONS
# ============================================================

def is_admin_logged_in():
    """Check whether the admin is logged in."""
    return session.get("admin_logged_in", False)


def validate_contact_form(name, email, subject, message):
    """Validate contact form fields."""

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


# ============================================================
# 4. HOME PAGE
# ============================================================

@app.route("/")
def home():
    """Display the portfolio home page."""
    return render_template("index.html")


# ============================================================
# 5. PORTFOLIO PAGES
# ============================================================

@app.route("/about")
def about():
    return render_template("pages/about.html")


@app.route("/projects")
def projects():
    return render_template("pages/projects.html")


@app.route("/resume")
def resume():
    return render_template("pages/resume.html")


# ============================================================
# 6. SERVE CSS
# ============================================================

@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory(
        os.path.join(PROJECT_DIR, "css"),
        filename
    )


# ============================================================
# 7. SERVE JAVASCRIPT
# ============================================================

@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory(
        os.path.join(PROJECT_DIR, "js"),
        filename
    )


# ============================================================
# 8. SERVE ASSETS
# ============================================================

@app.route("/assets/<path:filename>")
def serve_assets(filename):
    return send_from_directory(
        os.path.join(PROJECT_DIR, "assets"),
        filename
    )


# ============================================================
# 9. CONTACT PAGE
# ============================================================

@app.route("/contact", methods=["GET", "POST"])
def contact():

    if request.method == "POST":

        # Get form data
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        subject = request.form.get("subject", "").strip()
        message = request.form.get("message", "").strip()

        # Validate form
        errors = validate_contact_form(
            name,
            email,
            subject,
            message
        )

        if errors:
            return render_template(
                "pages/contact.html",
                errors=errors,
                name=name,
                email=email,
                subject=subject,
                message=message
            )

        try:
            connection = get_db()

            connection.execute(
                """
                INSERT INTO messages
                (name, email, subject, message, status)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    name,
                    email,
                    subject,
                    message,
                    "Unread"
                )
            )

            connection.commit()
            connection.close()

            flash(
                "Your message has been sent successfully!",
                "success"
            )

            return redirect(url_for("contact"))

        except sqlite3.Error:
            flash(
                "Something went wrong. Please try again later.",
                "error"
            )

            return redirect(url_for("contact"))

    return render_template("pages/contact.html")


# ============================================================
# 10. ADMIN LOGIN
# ============================================================

@app.route("/login", methods=["GET", "POST"])
def login():

    # If already logged in, go directly to dashboard
    if is_admin_logged_in():
        return redirect(url_for("dashboard"))

    if request.method == "POST":

        username = request.form.get(
            "username",
            ""
        ).strip()

        password = request.form.get(
            "password",
            ""
        )

        # Username can come from environment variable
        admin_username = os.environ.get(
            "ADMIN_USERNAME",
            "admin"
        )

        # Password should be stored as a HASH
        admin_password_hash = os.environ.get(
            "ADMIN_PASSWORD_HASH"
        )

        # Development fallback
        #
        # For real deployment, create an environment variable
        # called ADMIN_PASSWORD_HASH.
        if not admin_password_hash:
            admin_password_hash = (
                "scrypt:32768:8:1$"
                "demo$"
                "replace-this-password-hash"
            )

        # Check login
        if (
            username == admin_username
            and check_password_hash(
                admin_password_hash,
                password
            )
        ):
            session.clear()
            session["admin_logged_in"] = True

            return redirect(
                url_for("dashboard")
            )

        flash(
            "Invalid username or password.",
            "error"
        )

    return render_template(
        "admin/login.html"
    )


# ============================================================
# 11. ADMIN DASHBOARD
# ============================================================

@app.route("/dashboard")
def dashboard():

    # Protect dashboard
    if not is_admin_logged_in():
        return redirect(
            url_for("login")
        )

    connection = get_db()

    # Get all messages
    messages = connection.execute(
        """
        SELECT *
        FROM messages
        ORDER BY id DESC
        """
    ).fetchall()

    # Get message statistics
    total_messages = connection.execute(
        """
        SELECT COUNT(*)
        FROM messages
        """
    ).fetchone()[0]

    unread_messages = connection.execute(
        """
        SELECT COUNT(*)
        FROM messages
        WHERE status = 'Unread'
        """
    ).fetchone()[0]

    read_messages = connection.execute(
        """
        SELECT COUNT(*)
        FROM messages
        WHERE status = 'Read'
        """
    ).fetchone()[0]

    connection.close()

    return render_template(
        "admin/dashboard.html",
        messages=messages,
        total_messages=total_messages,
        unread_messages=unread_messages,
        read_messages=read_messages
    )


# ============================================================
# 12. MARK MESSAGE AS READ
# ============================================================

@app.route(
    "/message/read/<int:message_id>",
    methods=["POST"]
)
def mark_as_read(message_id):

    if not is_admin_logged_in():
        return redirect(
            url_for("login")
        )

    connection = get_db()

    connection.execute(
        """
        UPDATE messages
        SET status = 'Read'
        WHERE id = ?
        """,
        (message_id,)
    )

    connection.commit()
    connection.close()

    flash(
        "Message marked as read.",
        "success"
    )

    return redirect(
        url_for("dashboard")
    )


# ============================================================
# 13. DELETE MESSAGE
# ============================================================

@app.route(
    "/message/delete/<int:message_id>",
    methods=["POST"]
)
def delete_message(message_id):

    if not is_admin_logged_in():
        return redirect(
            url_for("login")
        )

    connection = get_db()

    connection.execute(
        """
        DELETE FROM messages
        WHERE id = ?
        """,
        (message_id,)
    )

    connection.commit()
    connection.close()

    flash(
        "Message deleted successfully.",
        "success"
    )

    return redirect(
        url_for("dashboard")
    )


# ============================================================
# 14. LOGOUT
# ============================================================

@app.route("/logout")
def logout():

    session.clear()

    flash(
        "You have been logged out.",
        "success"
    )

    return redirect(
        url_for("login")
    )


# ============================================================
# 15. ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def page_not_found(error):
    return render_template(
        "404.html"
    ), 404


@app.errorhandler(500)
def internal_server_error(error):
    return render_template(
        "500.html"
    ), 500


# ============================================================
# 16. START APPLICATION
# ============================================================

init_db()


if __name__ == "__main__":

    print("=" * 50)
    print("Sa Em Sromem Portfolio")
    print("=" * 50)
    print("Database: Ready")
    print("Server: http://127.0.0.1:5000")
    print("=" * 50)

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )