import sqlalchemy as sa

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from backend import app, db
from backend.models import Project, User, Label
from backend.models import LabelType
from . import api
from .helper_functions import (
    check_admin,
    check_admin_permissions,
    general_error,
    missing_data
)


@api.route("/projects/<int:project_id>/labels", methods=["POST"])
@jwt_required
def add_label_to_project(project_id):
    msg, status, request_user = check_admin_permissions(get_jwt_identity())
    if (msg is not None):
        return msg, status

    label_name = request.json.get("name", None)
    label_type_id = request.json.get("type", None)

    if not label_name:
        return (
            jsonify(
                message="Please provide a label name!",
                type="LABEL_NAME_MISSING"),
            400,
        )

    if not label_type_id:
        return (
            jsonify(
                message="Please provide a label type!",
                type="LABEL_TYPE_MISSING"),
            400,
        )

    label_type_id = int(label_type_id)

    if label_type_id not in [1, 2]:
        return (
            jsonify(
                message="Please assign correct label type!",
                type="LABEL_TYPE_INCORRECT"
            ),
            400,
        )

    try:
        if (len(LabelType.query.all()) == 0):
            select = LabelType(id=1, type='Select')

            mutliselect = LabelType(id=2, type='Multi-select')
            db.session.add_all([select, mutliselect])
            db.session.commit()
    except Exception as e:
        app.logger.error(e)

    try:
        project = Project.query.get(project_id)
        label_id = 1
        if len(Label.query.all()) > 0:
            last_label = Label.query.all()[len(Label.query.all())-1]
            label_id = last_label.id+1
        label = Label(name=label_name, type_id=label_type_id, id=label_id)
        project.labels.append(label)
        db.session.add(project)
        db.session.commit()
        db.session.refresh(label)
    except Exception as e:
        if type(e) == sa.exc.IntegrityError:
            app.logger.error(e)
            return (
                jsonify(
                    message=f"Label: {label_name} already exists!",
                    type="DUPLICATE_LABEL",
                ),
                409,
            )
        msg = f"Error adding label to project: {project_id}"
        return general_error(msg, e, type="LABEL_CREATION_FAILED")

    return (
        jsonify(
            project_id=project.id,
            label_id=label.id,
            message=f"Label assigned to project: {project.name}",
            type="LABEL_ASSIGNED_TO_PROJECT",
        ),
        201,
    )


@api.route("/projects/<int:project_id>/labels/<int:label_id>", methods=["GET"])
@jwt_required
def get_label_for_project(project_id, label_id):
    msg, status, request_user = check_admin(get_jwt_identity())
    if (msg is not None):
        return msg, status

    p_id = project_id
    err_msg = f"No label exists w/ Label ID: {label_id} Project ID: {p_id}"
    try:
        label = Label.query.filter_by(
                                      id=label_id,
                                      project_id=project_id
        ).first()
    except Exception as e:
        return missing_data(err_msg, additional_log=e)

    return (
        jsonify(
            project_id=project_id,
            label_id=label.id,
            label_name=label.name,
            label_type_id=label.label_type.id,
            label_type=label.label_type.type,
            created_on=label.created_at.strftime("%B %d, %Y"),
        ),
        200,
    )


@api.route("/projects/<int:project_id>/labels/<int:label_id>",
           methods=["PATCH"])
@jwt_required
def update_label_for_project(project_id, label_id):
    msg, status, request_user = check_admin_permissions(get_jwt_identity())
    if (msg is not None):
        return msg, status

    label_type_id = request.json.get("type", None)
    label_name = request.json.get("name", None)

    if not label_type_id:
        return (
            jsonify(
                message="Please provide valid label type!",
                type="LABEL_TYPE_MISSING"
            ),
            400,
        )

    label_type_id = int(label_type_id)
    if label_type_id not in [1, 2]:
        return (
            jsonify(
                message="Please assign correct label type!",
                type="LABEL_TYPE_INCORRECT"
            ),
            400,
        )

    p_id = project_id
    err_msg = f"No label exists w/ Label ID: {label_id} Project ID: {p_id}"
    try:
        label = Label.query.filter_by(
                                      id=label_id,
                                      project_id=project_id
        ).first()
        label.set_label_type(label_type_id)
        label.set_label_name(label_name)
        db.session.commit()
    except Exception as e:
        return missing_data(err_msg, additional_log=e)

    return (
        jsonify(
            project_id=project_id,
            label_id=label.id,
            label_name=label.name,
            label_type_id=label.label_type.id,
            label_type=label.label_type.type,
            created_on=label.created_at.strftime("%B %d, %Y"),
        ),
        200,
    )


@api.route("/projects/<int:project_id>/labels", methods=["GET"])
@jwt_required
def get_labels_for_project(project_id):
    identity = get_jwt_identity()

    try:
        request_user = User.query.filter_by(
                                            username=identity["username"]
        ).first()
        project = Project.query.get(project_id)

        if request_user not in project.users:
            return jsonify(message="Unauthorized access!"), 401

        labels = project.labels

        response = {}
        for label in labels:
            values = label.label_values
            type = label.label_type.type

            values = [{"value_id": value.id, "value": value.value}
                      for value in values]

            response[label.name] = {
                "type": type,
                "label_id": label.id,
                "values": values,
            }

    except Exception as e:
        return missing_data("Error fetching all labels", additional_log=e)

    return (jsonify(response), 200)
