import re
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

from .helper_functions import check_admin_permissions


def generate_api_key():
    return uuid.uuid4().hex


@api.route("/projects", methods=["POST"])
@jwt_required
def create_project():
    msg, status, request_user = check_admin_permissions(get_jwt_identity())
    if (msg is not None):
        return msg, status

    name = request.json.get("name", None)

    if not name:
        return (
            jsonify(
                message="Please provide a project name!",
                type="PROJECT_NAME_MISSING"
            ),
            400,
        )

    api_key = generate_api_key()

    try:
        project = Project(name=name, api_key=api_key,
                          creator_user_id=request_user.id)
        db.session.add(project)
        db.session.commit()
        db.session.refresh(project)
    except Exception as e:
        if type(e) == sa.exc.IntegrityError:
            app.logger.info(f"Project {name} already exists!")
            return (
                jsonify(message="Project already exists!",
                        type="DUPLICATE_PROJECT"),
                409,
            )
        app.logger.error("Error creating project")
        app.logger.error(e)
        return jsonify(message="Error creating project!"), 500

    return jsonify(project_id=project.id,
                   message="Project has been created!"), 201


@api.route("/projects", methods=["GET"])
@jwt_required
def fetch_all_projects():
    identity = get_jwt_identity()
    request_user = User.query.filter_by(username=identity["username"]).first()
    is_admin = True if request_user.role.role == "admin" else False

    if is_admin is False:
        return jsonify(message="Unauthorized access!"), 401
    try:
        projects = Project.query.all()
        response = list(
            [
                {
                    "project_id": project.id,
                    "name": project.name,
                    "api_key": project.api_key,
                    "created_by": project.creator_user.username,
                    "created_on": project.created_at.strftime("%B %d, %Y"),
                }
                for project in projects
            ]
        )
    except Exception as e:
        message = "Error fetching all projects"
        app.logger.error(message)
        app.logger.error(e)
        return jsonify(message=message), 500

    return jsonify(projects=response), 200


@api.route("/projects/<int:project_id>", methods=["GET"])
@jwt_required
def fetch_project(project_id):
    identity = get_jwt_identity()
    request_user = User.query.filter_by(username=identity["username"]).first()
    is_admin = True if request_user.role.role == "admin" else False

    if is_admin is False:
        return jsonify(message="Unauthorized access!"), 401

    try:
        project = Project.query.get(project_id)
        users = [
            {"user_id": user.id, "username": user.username}
            for user in project.users
        ]
        labels = [
            {
                "label_id": label.id,
                "name": label.name,
                "type": label.label_type.type,
                "created_on": label.created_at.strftime("%B %d, %Y"),
            }
            for label in project.labels
        ]
    except Exception as e:
        app.logger.error(f"No project exists with Project ID: {project_id}")
        app.logger.error(e)
        return (
            jsonify(
                message="No project exists with given project_id",
                project_id=project_id
            ),
            404,
        )
    app.logger.info(project.is_example)
    return (
        jsonify(
            project_id=project.id,
            name=project.name,
            is_example=project.is_example,
            users=users,
            labels=labels,
            api_key=project.api_key,
            created_by=project.creator_user.username,
            created_on=project.created_at.strftime("%B %d, %Y"),
        ),
        200,
    )


@api.route("/projects/<int:project_id>", methods=["PATCH"])
@jwt_required
def edit_project(project_id):
    msg, status, request_user = check_admin_permissions(get_jwt_identity())
    if (msg is not None):
        return msg, status

    try:
        project = Project.query.get(project_id)
        newUserName = request.json.get("name", None)
        is_example = request.json.get("is_example", None)
        if (newUserName is not None or newUserName == ''):
            project.set_name(newUserName)

        if (is_example is not None):
            app.logger.info(is_example)
            project.set_is_example(is_example)
        # user = User.query.get(user_id)
        # user.set_role(role_id)
        # user.set_username(newUserName)
        db.session.commit()

    except Exception as e:
        app.logger.error(f"No project exists with Project ID: {project_id}")
        app.logger.error(e)
        return (
            jsonify(
                message="No project exists with given project_id",
                project_id=project_id
            ),
            404,
        )

    return (
        jsonify(
            project_id=project.id,
            name=project.name,
            message="Successful edit"
        ),
        200,
    )


@api.route("/projects/<int:project_id>/users", methods=["PATCH"])
@jwt_required
def update_project_users(project_id):
    msg, status, request_user = check_admin_permissions(get_jwt_identity())
    if (msg is not None):
        return msg, status

    users = request.json.get("users", [])

    if type(users) != list:
        return (
            jsonify(
                message="Params `user` should be a list",
                type="INVALID_USERS"),
            400,
        )

    try:
        project = Project.query.get(project_id)
        # TODO: Decide whether to give creator of project access
        # project.users.append(request_user)
        final_users = [user for user in project.users]
        for user in project.users:
            if user.id not in users:
                final_users.remove(user)

        for user_id in users:
            user = User.query.get(user_id)
            if user not in project.users:
                final_users.append(user)

        project.users = final_users

        db.session.add(project)
        db.session.commit()
    except Exception as e:
        app.logger.error(f"Error adding users to project: {project_id}")
        app.logger.error(e)
        return (
            jsonify(
                message=f"Error adding users to project: {project_id}",
                type="USERS_ASSIGNMENT_FAILED",
            ),
            500,
        )

    return (
        jsonify(
            project_id=project.id,
            message=f"Users assigned to project: {project.name}",
            type="USERS_ASSIGNED_TO_PROJECT",
        ),
        200,
    )


@api.route("/projects/toggled", methods=["PATCH"])
@jwt_required
def set_toggled_features():
    msg, status, request_user = check_admin_permissions(get_jwt_identity())
    if (msg is not None):
        return msg, status

    features = request.json.get("featuresEnabled", {})
    project_id = request.json.get("projectId", None)

    project = Project.query.get(project_id)

    project.set_features(features)
    db.session.add(project)
    db.session.commit()
    db.session.refresh(project)

    try:
        project = Project.query.get(project_id)
        project.set_features(features)
        db.session.add(project)
        db.session.commit()
        db.session.refresh(project)
    except Exception as e:
        app.logger.error(f"Error adding features to project: {project_id}")
        app.logger.error(e)
        return (
            jsonify(
                message=f"Error adding features to project: {project_id}",
                type="USERS_ASSIGNMENT_FAILED",
            ),
            500,
        )
    return (
        jsonify(
            project_id=-1,
            message=f"features added",
            type="FEATURES_ASSIGNED_TO_PROJECT",
        ),
        200,
    )


@api.route("/projects/<int:project_id>/toggled", methods=["GET"])
def get_features(project_id):
    try:
        project = Project.query.get(project_id)

    except Exception as e:
        app.logger.error(f"No project exists with Project ID: {project_id}")
        app.logger.error(e)
        return (
            jsonify(
                message="No project exists with given project_id",
                project_id=project_id
            ),
            404,
        )

    return (
        jsonify(
            features_list=project.features_list,
        ),
        200,
    )


def find_example_projects():
    return Project.query.filter(Project.is_example == (True)).all()


def give_users_examples(user_id):
    for project in find_example_projects():
        try:
            if project is None:
                continue
            final_users = [user for user in project.users]
            user = User.query.filter_by(username=user_id).first()
            if user not in project.users:
                final_users.append(user)

            project.users = final_users
            db.session.add(project)
            db.session.commit()
        except Exception as e:
            app.logger.error(
                f"Error adding users to project:{User.query.all()[0].id}"
            )
            app.logger.error(e)
            return (
                jsonify(
                    message=f"Error adding users to project: {project.id}",
                    type="USERS_ASSIGNMENT_FAILED",
                ),
                500,
            )

    return (
        jsonify(
            project_id=-1,
            message=f"Users assigned to project: examples",
            type="USERS_ASSIGNED_TO_PROJECT",
        ),
        200,
    )


@api.route("/projects/<int:project_id>/data/<int:data_id>", methods=["PATCH"])
@jwt_required
def update_data(project_id, data_id):
    identity = get_jwt_identity()

    if not request.is_json:
        return jsonify(message="Missing JSON in request"), 400

    is_marked_for_review = bool(
                                request.json.get("is_marked_for_review", False)
    )

    try:
        request_user = User.query.filter_by(
                                            username=identity["username"]
        ).first()
        project = Project.query.get(project_id)

        if request_user not in project.users:
            return jsonify(message="Unauthorized access!"), 401

        data = Data.query.filter_by(id=data_id, project_id=project_id).first()

        # if request_user.username not in  data.assigned_user_id:
        #    return jsonify(message="Unauthorized access!"), 401

        data.update_marked_review(is_marked_for_review)

        db.session.add(data)
        db.session.commit()
        db.session.refresh(data)
    except Exception as e:
        app.logger.error(f"Error updating data")
        app.logger.error(e)
        return (
            jsonify(message=f"Error updating data",
                    type="DATA_UPDATION_FAILED"),
            500,
        )

    return (
        jsonify(
            data_id=data.id,
            is_marked_for_review=data.is_marked_for_review,
            message=f"Data updated",
            type="DATA_UPDATED",
        ),
        200,
    )


@api.route("/projects/<int:project_id>/annotations", methods=["GET"])
@jwt_required
def get_project_annotations(project_id):
    identity = get_jwt_identity()
    download_csv = request.headers["Csv"]
    try:
        request_user = User.query.filter_by(username=identity["username"]
                                            ).first()
        project = Project.query.get(project_id)
        is_admin = True if request_user.role.role == "admin" else False
        if is_admin is False:
            return jsonify(message="Unauthorized access!"), 401
        # if request_user not in project.users:
        #    return jsonify(message="Unauthorized access!"), 401

        annotations = []

        for data in project.data:
            data_dict = data.to_dict()
            data_dict["segmentations"] = []

            for segmentation in data.segmentations:
                segmentation_dict = segmentation.to_dict()

                values = dict()
                for value in segmentation.values:
                    if value.label.name not in values:
                        values[value.label.name] = {
                            "id": value.label.id,
                            "values": []
                            if value.label.label_type.type == "Multi-select"
                            else None,
                        }

                    if value.label.label_type.type == "Multi-select":
                        values[value.label.name]["values"].append(
                            {"id": value.id, "value": value.value}
                        )
                    else:
                        values[value.label.name]["values"] = {
                            "id": value.id,
                            "value": value.value,
                        }

                segmentation_dict["annotations"] = values

                data_dict["segmentations"].append(segmentation_dict)
            annotations.append(data_dict)
    except Exception as e:
        message = "Error fetching annotations for project"
        app.logger.error(message)
        app.logger.error(e)
        return jsonify(message=message, type="FETCH_ANNOTATIONS_FAILED"), 500
    if ((download_csv) == "true"):
        text, csv = JsonLabelsToCsv.JsonToText(annotations)
        annotations_to_download = csv
    else:
        annotations_to_download = annotations
    return (
        jsonify(
            message="Annotations fetched successfully",
            annotations=annotations_to_download,
            type="FETCH_ANNOTATION_SUCCESS",
        ),
        200,
    )
