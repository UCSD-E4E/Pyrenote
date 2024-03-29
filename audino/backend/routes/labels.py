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


@api.route("/labels/<int:label_id>/values", methods=["POST"])
@jwt_required
def add_value_to_label(label_id):
    msg, status, request_user = check_admin_permissions(get_jwt_identity())
    if msg is not None:
        return msg, status

    value = request.json.get("value", None)

    if not value:
        return (
            jsonify(message="Please provide a label value!",
                    type="VALUE_MISSING"), 400,)

    try:
        label_value = LabelValue(value=value, label_id=label_id)
        db.session.add(label_value)
        db.session.commit()
        db.session.refresh(label_value)
    except Exception as e:
        if type(e) == sa.exc.IntegrityError:
            app.logger.error(e)
            return (
                jsonify(
                    message=f"Label Value: {value} already exists!",
                    type="DUPLICATE_VALUE",
                ),
                409,
            )
        msg = f"Error adding value to label"
        return general_error(msg, e, type="VALUE_CREATION_FAILED")

    return (
        jsonify(
            value_id=label_value.id,
            message=f"Value assigned to label",
            type="VALUE_ASSIGNED_TO_LABEL",
        ),
        201,
    )


@api.route("/labels/<int:label_id>/values/file", methods=["POST"])
@jwt_required
def add_value_to_label_from_file(label_id):
    app.logger.info("hello")
    msg, status, request_user = check_admin_permissions(get_jwt_identity(),
                                                        False)
    if msg is not None:
        return msg, status

    file = request.files.get(str(0))

    if not file:
        return (
            jsonify(message="Please provide a label value!",
                    type="VALUE_MISSING"), 400,)
    app.logger.info("hello")
    file = file.read().decode("utf-8-sig")
    app.logger.info(file)
    app.logger.info(type(file))
    data = file.split("\n")
    for value in data:
        if value == "":
            continue
        try:
            value = value.strip(' \t\n\r')
            label_value = LabelValue(value=value, label_id=label_id)
            db.session.add(label_value)
            db.session.commit()
            db.session.refresh(label_value)
        except Exception as e:
            if type(e) == sa.exc.IntegrityError:
                app.logger.error(e)
            else:
                msg = f"Error adding value to label"
                return general_error(msg, e, type="VALUE_CREATION_FAILED")

    return (
        jsonify(
            value_id=label_value.id,
            message=f"Value assigned to label",
            type="VALUE_ASSIGNED_TO_LABEL",
        ),
        201,
    )


@api.route("/labels/<int:label_id>/values", methods=["GET"])
@jwt_required
def get_values_for_label(label_id):
    msg, status, request_user = check_admin(get_jwt_identity())
    if msg is not None:
        return msg, status

    try:
        values = LabelValue.query.filter_by(label_id=label_id).all()
        response = [
            {
                "value_id": value.id,
                "value": value.value,
                "created_on": value.created_at.strftime("%B %d, %Y"),
            }
            for value in values
        ]
    except Exception as e:
        return missing_data(f"No values exists for label with id: {label_id}",
                            additional_log=e)

    return (jsonify(values=response), 200)


@api.route("/labels/<int:label_id>/values/<int:label_value_id>",
           methods=["GET"])
@jwt_required
def fetch_label_value(label_id, label_value_id):
    msg, status, request_user = check_admin(get_jwt_identity())
    if msg is not None:
        return msg, status

    try:
        value = LabelValue.query.get(label_value_id)
    except Exception as e:
        return missing_data(f"No values exists for label with id: {label_id}",
                            additional_log=e)

    return (
        jsonify(
            values={
                "value_id": value.id,
                "value": value.value,
                "created_on": value.created_at.strftime("%B %d, %Y"),
            }
        ),
        200,
    )


@api.route("/labels/<int:label_id>/values/<int:label_value_id>",
           methods=["DELETE"])
@jwt_required
def delete_label_value(label_id, label_value_id):
    msg, status, request_user = check_admin(get_jwt_identity())
    if msg is not None:
        return msg, status

    try:
        value = LabelValue.query.get(label_value_id)
        db.session.delete(value)
        db.session.commit()
    except Exception as e:
        return missing_data(f"No values exists for value: {label_value_id}",
                            additional_log=e)

    return (
        jsonify(
            values={
                "value_id": value.id,
                "value": value.value,
                "created_on": value.created_at.strftime("%B %d, %Y"),
            }
        ),
        200,
    )


@api.route("/labels/<int:label_id>/values/<int:label_value_id>",
           methods=["PATCH"])
@jwt_required
def update_value_for_label(label_id, label_value_id):
    msg, status, request_user = check_admin_permissions(get_jwt_identity())
    if msg is not None:
        return msg, status

    value = request.json.get("value", None)

    if not value:
        return (
            jsonify(message="Please provide a label value!",
                    type="VALUE_MISSING"),
            400,
        )
    err = f"Label Value ID: {label_value_id} no exist w/ Label ID: {label_id}"
    try:
        label_value = LabelValue.query.get(label_value_id)
        label_value.set_label_value(value)
        db.session.commit()
    except Exception as e:
        if type(e) == sa.exc.IntegrityError:
            app.logger.error(f"Label Value: {value} already exists! {e}")
            return (
                jsonify(
                    message=f"Label Value: {value} already exists!",
                    type="DUPLICATE_VALUE",
                ),
                409,
            )
        return missing_data(err, additional_log=e)

    return (
        jsonify(
            value_id=label_value.id,
            value=label_value.value,
            created_on=label_value.created_at.strftime("%B %d, %Y"),
        ),
        200,
    )


@api.route("/labels/<int:label_id>/projectId/<int:project_id>",
           methods=["DELETE"])
@jwt_required
def delete_label(label_id, project_id):
    msg, status, request_user = check_admin(get_jwt_identity())
    if msg is not None:
        return msg, status

    try:
        LabelCat = Label.query.get(label_id)
        project = Project.query.get(project_id)
        LabelValues = LabelValue.query.filter_by(label_id=label_id).all()

        for value in LabelValues:
            db.session.delete(value)
            db.session.commit()

        project.labels.remove(LabelCat)
        db.session.delete(LabelCat)
        db.session.commit()

    except Exception as e:
        message = f"No value found with value id: {LabelCat}"
        return missing_data(message, additional_log=e)

    return (jsonify(message="success"), 200)
