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


def generate_api_key():
    return uuid.uuid4().hex


@api.route("/projects", methods=["POST"])
@jwt_required
def create_project():
    identity = get_jwt_identity()
    request_user = User.query.filter_by(username=identity["username"]).first()
    is_admin = True if request_user.role.role == "admin" else False

    if is_admin is False:
        return jsonify(message="Unauthorized access!"), 401

    if not request.is_json:
        return jsonify(message="Missing JSON in request"), 400

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

    return (
        jsonify(
            project_id=project.id,
            name=project.name,
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
    app.logger.info("hello")
    identity = get_jwt_identity()
    request_user = User.query.filter_by(username=identity["username"]).first()
    is_admin = True if request_user.role.role == "admin" else False

    if is_admin is False:
        return jsonify(message="Unauthorized access!"), 401

    try:
        project = Project.query.get(project_id)
        newUserName = request.json.get("name", None)
        project.set_name(newUserName)
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
        ),
        200,
    )


@api.route("/projects/<int:project_id>/users", methods=["PATCH"])
@jwt_required
def update_project_users(project_id):
    identity = get_jwt_identity()
    request_user = User.query.filter_by(username=identity["username"]).first()
    is_admin = True if request_user.role.role == "admin" else False

    if is_admin is False:
        return jsonify(message="Unauthorized access!"), 401

    if not request.is_json:
        return jsonify(message="Missing JSON in request"), 400

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
    identity = get_jwt_identity()
    request_user = User.query.filter_by(username=identity["username"]).first()
    is_admin = True if request_user.role.role == "admin" else False
    if is_admin is False:
        return jsonify(message="Unauthorized access!"), 401

    if not request.is_json:
        return jsonify(message="Missing JSON in request"), 400

    features = request.json.get("featuresEnabled", {})
    project_id = request.json.get("projectId", None)

    app.logger.info(features)

    project = Project.query.get(project_id)
    project.set_features(features)
    db.session.add(project)
    db.session.commit()
    db.session.refresh(project)
    app.logger.info("hello")

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


@api.route("/projects/example", methods=["PATCH"])
def give_users_examples():
    user_id = request.json.get("users")
    app.logger.info(f"{user_id}")
    for project_id in [3, 4, 5]:
        try:
            project = Project.query.get(project_id)
            # TODO: Decide whether to give creator of project access
            # project.users.append(request_user)
            if project is None:
                app.logger.info(f"{project_id} is null")
                continue
            final_users = [user for user in project.users]
            user = User.query.filter_by(username=user_id).first()
            app.logger.info(f"{user.username}")
            if user not in project.users:
                final_users.append(user)

            project.users = final_users
            app.logger.info(f"{final_users}")
            db.session.add(project)
            db.session.commit()
        except Exception as e:
            app.logger.error(
                f"Error adding users to project:{User.query.all()[0].id}"
            )
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
            project_id=-1,
            message=f"Users assigned to project: examples",
            type="USERS_ASSIGNED_TO_PROJECT",
        ),
        200,
    )


@api.route("/projects/<int:project_id>/labels", methods=["POST"])
@jwt_required
def add_label_to_project(project_id):
    identity = get_jwt_identity()
    request_user = User.query.filter_by(username=identity["username"]).first()
    is_admin = True if request_user.role.role == "admin" else False

    if is_admin is False:
        return jsonify(message="Unauthorized access!"), 401

    if not request.is_json:
        return jsonify(message="Missing JSON in request"), 400

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
            app.logger.info("Creating labelTypes")
            select = LabelType(id=1, type='Select')

            mutliselect = LabelType(id=2, type='Multi-select')
            db.session.add_all([select, mutliselect])
            db.session.commit()
    except Exception as e:
        app.logger.error(e)

    try:
        project = Project.query.get(project_id)
        app.logger.info(f"Label: {LabelType.query.all()} AT 0")
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
            app.logger.info(e)
            app.logger.info(f"Label: {label_name} already exists!")
            return (
                jsonify(
                    message=f"Label: {label_name} already exists!",
                    type="DUPLICATE_LABEL",
                ),
                409,
            )
        app.logger.error(f"Error adding label to project: {project_id}")
        app.logger.error(e)
        return (
            jsonify(
                message=f"Error adding label to project: {project_id}",
                type="LABEL_CREATION_FAILED",
            ),
            500,
        )

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
    identity = get_jwt_identity()
    request_user = User.query.filter_by(username=identity["username"]).first()
    is_admin = True if request_user.role.role == "admin" else False
    p_id = project_id
    if is_admin is False:
        return jsonify(message="Unauthorized access!"), 401
    err_msg = f"No label exists w/ Label ID: {label_id} Project ID: {p_id}"
    try:
        label = Label.query.filter_by(
                                      id=label_id,
                                      project_id=project_id
        ).first()
    except Exception as e:
        app.logger.error(err_msg)
        app.logger.error(e)
        return (
            jsonify(
                message=err_msg
            ),
            404,
        )

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
    identity = get_jwt_identity()
    request_user = User.query.filter_by(username=identity["username"]).first()
    is_admin = True if request_user.role.role == "admin" else False

    if is_admin is False:
        return jsonify(message="Unauthorized access!"), 401

    if not request.is_json:
        return jsonify(message="Missing JSON in request"), 400

    label_type_id = request.json.get("type", None)

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
        db.session.commit()
    except Exception as e:
        # TODO: Check for errors here
        app.logger.error(err_msg)
        app.logger.error(e)
        return (
            jsonify(err_msg), 404,
        )

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
        app.logger.error("Error fetching all labels")
        app.logger.error(e)
        return (jsonify(message="Error fetching all labels"), 404)

    return (jsonify(response), 200)


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
            app.logger.info(project.users.id)
            app.logger.info(request_user.id)
            return jsonify(message="Unauthorized access!"), 401

        data = Data.query.filter_by(id=data_id, project_id=project_id).first()

        segmentations = []
        for segment in data.segmentations:
            resp = {
                "segmentation_id": segment.id,
                "start_time": segment.start_time,
                "end_time": segment.end_time,
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

    if start_time is None or end_time is None:
        return (
            jsonify(message="Params `start_time` or `end_time` missing"), 400
        )

    if type(start_time) is not float or type(end_time) is not float:
        msg = "Params `start_time` and `end_time` need to be float values"
        return (
            jsonify(
                message=msg
            ),
            400,
        )

    annotations = request.json.get("annotations", dict())
    # miliseconds to seconds
    time_spent = request.json.get("time_spent", 0) / 1000
    app.logger.info(time_spent)
    start_time = round(start_time, 4)
    end_time = round(end_time, 4)

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


@api.route("/projects/<int:project_id>/annotations", methods=["GET"])
@jwt_required
def get_project_annotations(project_id):
    identity = get_jwt_identity()
    app.logger.info(request.headers["Csv"])
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
        app.logger.info("could do this, error isn't here")
    except Exception as e:
        message = "Error fetching annotations for project"
        app.logger.error(message)
        app.logger.error(e)
        return jsonify(message=message, type="FETCH_ANNOTATIONS_FAILED"), 500
    if ((download_csv) == "true"):
        text, csv = JsonLabelsToCsv.JsonToText(annotations)
        app.logger.info(f'{type(text)}, {text}')
        annotations_to_download = csv
        app.logger.info("here: ", annotations_to_download)
    else:
        annotations_to_download = annotations
        app.logger.info("here: ", annotations_to_download)
    return (
        jsonify(
            message="Annotations fetched successfully",
            annotations=annotations_to_download,
            type="FETCH_ANNOTATION_SUCCESS",
        ),
        200,
    )
