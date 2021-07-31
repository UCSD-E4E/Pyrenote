import sqlalchemy as sa
import uuid

from flask import jsonify, flash, redirect, url_for, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.urls import url_parse

from backend import app, db
from backend.models import Project, User, Label, Data, Segmentation
from backend.models import LabelValue, LabelType
from . import api
from .data import generate_segmentation

from backend.routes import JsonLabelsToCsv


def check_admin_permissions(identity):
    request_user = User.query.filter_by(username=identity["username"]).first()
    is_admin = True if request_user.role.role == "admin" else False
    if is_admin is False:
        return jsonify(message="Unauthorized access!"), 401, request_user

    if not request.is_json:
        return jsonify(message="Missing JSON in request"), 400, request_user
    return None, None, request_user


def retrieve_database(project_id, segmentations, categories, request_user=None,
                      big_key=None):
    data = {}
    if ("pending" in categories):
        if (request_user is not None):
            data["pending"] = (
                db.session.query(Data)
                .filter(request_user.id == Data.assigned_user_id[big_key])
                .filter(Data.project_id == project_id)
                .filter(Data.id.notin_(segmentations))
                .distinct()
                .order_by(Data.last_modified.desc())
            )
        else:
            data["pending"] = (
                db.session.query(Data)
                .filter(Data.project_id == project_id)
                .filter(Data.id.notin_(segmentations))
                .distinct()
                .order_by(Data.last_modified.desc())
            )

    if ("completed" in categories):
        if (request_user is not None):
            data["completed"] = (
                db.session.query(Data)
                .filter(Data.project_id == project_id)
                .filter(Data.id.in_(segmentations))
                .distinct()
                .order_by(Data.last_modified.desc())
            )
        else:
            data["completed"] = (
                db.session.query(Data)
                .filter(request_user.id == Data.assigned_user_id[big_key])
                .filter(Data.project_id == project_id)
                .filter(Data.id.in_(segmentations))
                .distinct()
                .order_by(Data.last_modified.desc())
            )

    if ("marked_review") in categories:
        data["marked_review"] = Data.query.filter_by(
            project_id=project_id,
            is_marked_for_review=True,
        ).order_by(Data.last_modified.desc())

    if ("all") in categories:
        data["all"] = Data.query.filter_by(
            project_id=project_id
        ).order_by(Data.last_modified.desc())

    return data
