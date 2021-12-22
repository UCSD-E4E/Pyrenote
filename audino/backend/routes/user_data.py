from flask import jsonify, request

from backend import app, db
from backend.models import User, Data
from sqlalchemy.sql.expression import false, true, null
from sqlalchemy import or_
import sqlalchemy as sa

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import csv

from sqlalchemy.sql.expression import false
from backend import app, db
from backend.models import Label, LabelValue, Project
from .helper_functions import (
    check_admin,
    check_admin_permissions,
    general_error,
    missing_data
)
from . import api
from .projects import get_project_annotations_raw
## List of data to get for user
## show list of last 10 data points of annotations completed
## Username
## pfp picture?
## Number of annotations created by each users per project
## get all annotations completed by users *****
## 


@api.route("/user_data", methods=["GET"])
@jwt_required
def fetch_user_data():
    identity = get_jwt_identity()
    request_user = User.query.filter_by(username=identity["username"]
                                        ).first()
    if (request_user is None):
        return "failed", 404
    
    return "success", 200

@api.route("/user_data_annotations", methods=["GET"])
@jwt_required
def get_self_annotations():
    identity = get_jwt_identity()
    request_user = User.query.filter_by(username=identity["username"]
                                        ).first()
    annotations = get_user_annotations(request_user)
    return (
        jsonify(
            annotations
        ),
        200,
    )
@api.route("/user_data_annotations/<int:user_id>", methods=["GET"])
@jwt_required
def get_requested_user_annotations(user_id):
    msg, status, request_user = check_admin(get_jwt_identity())
    if msg is not None:
        return msg, status
    
    request_user = User.query.filter_by(id=user_id).distinct().first()
    if (request_user is None):
        return jsonify(message="No such user exists"), 404

    annotations = get_user_annotations(request_user)
    return (
        jsonify(
            annotations
        ),
        200,
    )

def get_user_annotations(user):
    projects = Project.query.join(Project.users, aliased=True)\
                    .filter_by(username=user.username)
    app.logger.info(projects)
    annotations = {"_User_": user.username}
    for project in projects:
        annotations[project.name] = get_project_annotations_raw(project, user.username)
        # use project and pull all annotations that the user made
    return annotations
