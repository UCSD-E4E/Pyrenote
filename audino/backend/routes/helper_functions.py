from flask import jsonify, request

from backend import app, db
from backend.models import User, Data
from sqlalchemy.sql.expression import false, true, null
from sqlalchemy import or_
"""return and log an error message that is not a specific error"""


def general_error(custom_message, error, type="error"):
    try:
        message = custom_message + error
    except Exception:
        message = custom_message
    app.logger.error(message)
    app.logger.error(error)
    return jsonify(message=message, type=type), 500


def missing_data(custom_message, query=None, additional_log=""):
    msg = custom_message
    app.logger.error(msg)
    app.logger.error(additional_log)
    if (query is None):
        return jsonify(message=msg, type="NOT_IN_DATABASE"), 404
    return jsonify(message=msg, mssing_data=query, type="NOT_IN_DATABASE"), 404


def check_admin(identity):
    request_user = User.query.filter_by(username=identity["username"]).first()
    is_admin = True if request_user.role.role == "admin" else False
    if is_admin is False:
        return jsonify(message="Unauthorized access!"), 401, request_user
    return None, None, request_user


def check_admin_permissions(identity, json=True):
    msg, status, request_user = check_admin(identity)
    if msg is not None:
        return msg, status

    if not request.is_json and json:
        return jsonify(message="Missing JSON in request"), 400, request_user
    return None, None, request_user


def retrieve_database(project_id, segmentations, categories, request_user=None,
                      big_key=None):
    data = {}
    if ("pending" in categories):
        if (request_user is not None):
            data["pending"] = (
                db.session.query(Data)
                .filter(or_(Data.sample != true(), Data.sample == null()))
                .filter(request_user.id == Data.assigned_user_id[big_key])
                .filter(Data.project_id == project_id)
                .filter(Data.id.notin_(segmentations))
                .distinct()
                .order_by(Data.last_modified.desc())
            )
        else:
            data["pending"] = (
                db.session.query(Data)
                .filter(or_(Data.sample != true(), Data.sample == null()))
                .filter(Data.project_id == project_id)
                .filter(Data.id.notin_(segmentations))
                .distinct()
                .order_by(Data.last_modified.desc())
            )

    if ("completed" in categories):
        if (request_user is not None):
            data["completed"] = (
                db.session.query(Data)
                .filter(or_(Data.sample != true(), Data.sample == null()))
                .filter(request_user.id == Data.assigned_user_id[big_key])
                .filter(Data.project_id == project_id)
                .filter(Data.id.in_(segmentations))
                .distinct()
                .order_by(Data.last_modified.desc())
            )
        else:
            data["completed"] = (
                db.session.query(Data)
                .filter(or_(Data.sample != true(), Data.sample == null()))
                .filter(Data.project_id == project_id)
                .filter(Data.id.in_(segmentations))
                .distinct()
                .order_by(Data.last_modified.desc())
            )

    if ("marked_review") in categories:
        app.logger.info("made it here")
        data["marked_review"] = (
             db.session.query(Data)
             .filter(Data.project_id == project_id)
             .filter(Data.is_marked_for_review == true())
             .filter(or_(Data.sample != true(), Data.sample == null()))
             .order_by(Data.last_modified.desc())
        )
    app.logger.info("got data here")

    if ("all") in categories:
        app.logger.info("made it here")
        data["all"] = Data.query.filter_by(
            project_id=project_id,
            sample=False
        ).order_by(Data.last_modified.desc())
    app.logger.info(data)
    return data


def check_login(username, password, role_id):
    if not username:
        return (
            jsonify(message="Please provide your username!",
                    type="USERNAME_MISSING"),
            400,
        )
    if not password:
        return (
            jsonify(message="Please provide your password!",
                    type="PASSWORD_MISSING"),
            400,
        )

    if not role_id:
        return (jsonify(message="Please provide your role!",
                type="ROLE_MISSING"), 400)
    return None, None
