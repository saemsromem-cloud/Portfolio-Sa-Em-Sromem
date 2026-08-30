from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3
import os

app = Flask(__name__)

# =========================
# FLASK CONFIGURATION
# =========================

app.secret_key = "sa-em-sromem-change-this-secret-key"

# =========================
# DATABASE
# =========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "messages.db")


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'Unread'
        )
    """)

    conn.commit()
    conn.close()


# =========================
# CONTACT PAGE
# =========================

@app.route("/contact", methods=["GET", "POST"])
def contact():

    if request.method == "POST":

        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        subject = request.form.get("subject", "").strip()
        message = request.form.get("message", "").strip()

        # Basic validation
        if not name or not email or not subject or not message:
            return render_template(
                "contact.html",
                error="Please fill in all fields."
            )

        conn = get_db()

        conn.execute("""
            INSERT INTO messages
            (name, email, subject, message)
            VALUES (?, ?, ?, ?)
        """, (
            name,
            email,
            subject,
            message
        ))

        conn.commit()
        conn.close()

        return render_template(
            "contact.html",
            success="Your message has been sent successfully!"
        )

    return render_template("contact.html")


# =========================
# ADMIN LOGIN
# =========================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        # CHANGE THESE
        ADMIN_USERNAME = "admin"
        ADMIN_PASSWORD = "123456"

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:

            session["admin_logged_in"] = True

            return redirect(url_for("dashboard"))

        return render_template(
            "login.html",
            error="Invalid username or password."
        )

    return render_template("login.html")


# =========================
# ADMIN DASHBOARD
# =========================

@app.route("/dashboard")
def dashboard():

    # Protect dashboard
    if not session.get("admin_logged_in"):
        return redirect(url_for("login"))

    conn = get_db()

    # Get all messages
    messages = conn.execute("""
        SELECT *
        FROM messages
        ORDER BY id DESC
    """).fetchall()

    # Total messages
    total_messages = conn.execute("""
        SELECT COUNT(*)
        FROM messages
    """).fetchone()[0]

    # Unread messages
    unread_messages = conn.execute("""
        SELECT COUNT(*)
        FROM messages
        WHERE status = 'Unread'
    """).fetchone()[0]

    # Read messages
    read_messages = conn.execute("""
        SELECT COUNT(*)
        FROM messages
        WHERE status = 'Read'
    """).fetchone()[0]

    conn.close()

    return render_template(
        "dashboard.html",
        messages=messages,
        total_messages=total_messages,
        unread_messages=unread_messages,
        read_messages=read_messages
    )


# =========================
# MARK AS READ
# =========================

@app.route("/message/read/<int:message_id>")
def mark_as_read(message_id):

    if not session.get("admin_logged_in"):
        return redirect(url_for("login"))

    conn = get_db()

    conn.execute("""
        UPDATE messages
        SET status = 'Read'
        WHERE id = ?
    """, (message_id,))

    conn.commit()
    conn.close()

    return redirect(url_for("dashboard"))


# =========================
# DELETE MESSAGE
# =========================

@app.route("/message/delete/<int:message_id>")
def delete_message(message_id):

    if not session.get("admin_logged_in"):
        return redirect(url_for("login"))

    conn = get_db()

    conn.execute("""
        DELETE FROM messages
        WHERE id = ?
    """, (message_id,))

    conn.commit()
    conn.close()

    return redirect(url_for("dashboard"))


# =========================
# LOGOUT
# =========================

@app.route("/logout")
def logout():

    session.clear()

    return redirect(url_for("login"))


# =========================
# START SERVER
# =========================

if __name__ == "__main__":

    init_db()

    print("Database initialized.")
    print("Server running at http://127.0.0.1:5000")

    app.run(debug=True)