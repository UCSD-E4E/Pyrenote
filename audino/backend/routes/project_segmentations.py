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


@api.route(
    "/projects/<int:project_id>/data/<int:data_id>/segmentations/<int:seg_id>",
    methods=["DELETE"],
)
@jwt_required
def delete_segmentations(project_id, data_id, seg_id):
    identity = get_jwt_identity()
    segmentation_id = seg_id
    try:
        request_user = User.query.filter_by(username=identity["username"]
                                            ).first()
        project = Project.query.get(project_id)

        if request_user not in project.users:
            return jsonify(message="Unauthorized access!"), 401

        data = Data.query.filter_by(id=data_id, project_id=project_id).first()

        # if request_user.username not in  data.assigned_user_id:
        #    return jsonify(message="Unauthorized access!"), 401

        segmentation = Segmentation.query.filter_by(
            data_id=data_id, id=segmentation_id
        ).first()

        db.session.delete(segmentation)
        db.session.commit()
    except Exception as e:
        app.logger.error(f"Could not delete segmentation")
        app.logger.error(e)
        return (
            jsonify(
                message=f"Could not delete segmentation",
                type="SEGMENTATION_DELETION_FAILED",
            ),
            500,
        )

    return (
        jsonify(
            segmentation_id=segmentation_id,
            message="Segmentation deleted",
            type="SEGMENTATION_DELETED",
        ),
        204,
    )


@api.route(
    "/projects/<int:project_id>/data/<int:data_id>/segmentations",
    methods=["POST"]
)
@api.route(
    "/projects/<int:project_id>/data/<int:data_id>/segmentations/<int:seg_id>",
    methods=["PUT"],
)
@jwt_required
def add_segmentations(project_id, data_id, seg_id=None):
    identity = get_jwt_identity()
    segmentation_id = seg_id
    if not request.is_json:
        return jsonify(message="Missing JSON in request"), 400

    start_time = float(request.json.get("start", None))
    end_time = float(request.json.get("end", None))
    max_freq = float(request.json.get("regionTopFrequency", None))
    min_freq = float(request.json.get("regionBotFrequency", None))

    if start_time is None or end_time is None:
        return (
            jsonify(message="Params `start_time` or `end_time` missing"), 400
        )

    if max_freq is None or min_freq is None:
        return jsonify(message="Params `max_freq` or `min_freq` missing"), 400

    if type(start_time) is not float or type(end_time) is not float:
        msg = "Params `start_time` and `end_time` need to be float values"
        return (
            jsonify(
                message=msg
            ),
            400,
        )

    if type(max_freq) is not float or type(min_freq) is not float:
        return (
            jsonify(
                message="Params `max_freq` and `min_freq` need to be floats"
            ),
            400,
        )

    annotations = request.json.get("annotations", dict())
    # miliseconds to seconds
    time_spent = request.json.get("time_spent", 0) / 1000
    start_time = round(start_time, 4)
    end_time = round(end_time, 4)
    max_freq = round(max_freq, 4)
    min_freq = round(min_freq, 4)

    try:
        request_user = User.query.filter_by(username=identity["username"]
                                            ).first()
        project = Project.query.get(project_id)

        if request_user not in project.users:
            return jsonify(message="Unauthorized access!"), 401

        data = Data.query.filter_by(id=data_id, project_id=project_id).first()
        # if request_user.username not in  data.assigned_user_id:
        #    return jsonify(message="Unauthorized access!"), 401

        segmentation = generate_segmentation(
            data_id=data_id,
            project_id=project.id,
            end_time=end_time,
            start_time=start_time,
            max_freq=max_freq,
            min_freq=min_freq,
            annotations=annotations,
            time_spent=time_spent,
            segmentation_id=segmentation_id,

        )

        db.session.add(segmentation)
        db.session.commit()
        db.session.refresh(segmentation)
    except Exception as e:
        app.logger.error(f"Could not create segmentation")
        app.logger.error(e)
        return (
            jsonify(
                message=f"Could not create segmentation",
                type="SEGMENTATION_CREATION_FAILED",
            ),
            500,
        )

    if request.method == "POST":
        message = "Segmentation created"
        operation_type = "SEGMENTATION_CREATED"
        status = 201
    else:
        message = "Segmentation updated"
        operation_type = "SEGMENTATION_UPDATED"
        status = 204

    return (
        jsonify(segmentation_id=segmentation.id, message=message,
                type=operation_type),
        status,
    )


@api.route("/projects/<int:project_id>/data/<int:data_id>", methods=["GET"])
@jwt_required
def get_segmentations_for_data(project_id, data_id):
    identity = get_jwt_identity()

    try:
        request_user = User.query.filter_by(
                                            username=identity["username"]
        ).first()
        project = Project.query.get(project_id)

        if request_user not in project.users:
            msg = "Unauthorized access! User not in project users"
            return jsonify(message=msg), 401

        data = Data.query.filter_by(id=data_id, project_id=project_id).first()

        segmentations = []
        for segment in data.segmentations:
            resp = {
                "segmentation_id": segment.id,
                "start_time": segment.start_time,
                "end_time": segment.end_time,
                "max_freq": segment.max_freq,
                "min_freq": segment.min_freq,
            }

            values = dict()
            for value in segment.values:
                if value.label.name not in values:
                    values[value.label.name] = {
                        "label_id": value.label.id,
                        "values": []
                        if value.label.label_type.type == "Multi-select"
                        else None,
                    }

                if value.label.label_type.type == "Multi-select":
                    values[value.label.name]["values"].append(value.id)
                else:
                    values[value.label.name]["values"] = value.id

            resp["annotations"] = values

            segmentations.append(resp)

        response = {
            "filename": data.filename,
            "original_filename": data.original_filename,
            "is_marked_for_review": data.is_marked_for_review,
            "segmentations": segmentations,
            "sampling_rate": data.sampling_rate,
            "clip_length": data.clip_length,
        }

    except Exception as e:
        app.logger.error("Error fetching datapoint with given id")
        app.logger.error(e)
        return (jsonify(message="Error fetching datapoint with given id"), 404)

    return (jsonify(response), 200)