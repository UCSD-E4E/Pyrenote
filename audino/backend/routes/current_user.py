import sqlalchemy as sa
from sqlalchemy import or_
from sqlalchemy.sql.expression import false, true, null
import uuid

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.urls import url_parse
from .projects import give_users_examples
from backend import app, db
from backend.models import Project, User, Data, Segmentation
from .helper_functions import retrieve_database, general_error, missing_data
from .logger import post_log_msg
from . import api


@api.route("/current_user/projects", methods=["GET"])
@jwt_required
def fetch_current_user_projects():
    identity = get_jwt_identity()
    try:
        request_user = User.query.filter_by(username=identity["username"]
                                            ).first()
        give_users_examples(request_user.id)
        response = list(
            [
                {
                    "project_id": project.id,
                    "name": project.name,
                    "created_by": project.creator_user.username,
                    "created_on": project.created_at.strftime("%B %d, %Y"),
                }
                for project in request_user.projects
            ]
        )
    except Exception as e:
        return general_error("Error fetching all projects", e)
    post_log_msg("Accessed project's page", request_user.id)
    return jsonify(projects=response), 200


@api.route("/current_user/projects/<int:project_id>/data", methods=["GET"])
@jwt_required
def fetch_data_for_project(project_id):
    identity = get_jwt_identity()

    page = request.args.get("page", 1, type=int)
    active = request.args.get("active", "pending", type=str)
    try:
        request_user = User.query.filter_by(username=identity["username"]
                                            ).first()
        project = Project.query.get(project_id)

        if request_user not in project.users:
            return jsonify(message="Unauthorized access!"), 401

        segmentations = db.session.query(Segmentation.data_id
                                         ).distinct().subquery()

        categories = ["pending", "completed", "marked_review", "all"]
        data = retrieve_database(project_id, segmentations, categories)
        app.logger.info(data)
        paginate_data = data[active].paginate(page, 10, False)

        next_page = paginate_data.next_num if paginate_data.has_next else None
        prev_page = paginate_data.prev_num if paginate_data.has_prev else None
        app.logger.info("HELLO")
        response = list(
            [
                {
                    "data_id": data_point.id,
                    "filename": data_point.filename,
                    "original_filename": data_point.original_filename,
                    "created_on": "a date",
                    # data_point.created_at.strftime("%B %d, %Y"),
                    "is_marked_for_review": data_point.is_marked_for_review,
                    "number_of_segmentations": len(data_point.segmentations),
                    "sampling_rate": data_point.sampling_rate,
                    "clip_length": data_point.clip_length,
                    "sample": data_point.sample
                }
                for data_point in paginate_data.items
            ]
        )
        count_data = {key: value.count() for key, value in data.items()}
        app.logger.info("HELLO")
    except Exception as e:
        return general_error("Error fetching all projects", e)

    return (
        jsonify(
            data=response,
            count=count_data,
            next_page=next_page,
            prev_page=prev_page,
            page=page,
            active=active,
        ),
        200,
    )


@api.route("/current_user/projects/<int:project_id>/data/<int:data_value>",
           methods=["GET"])
@jwt_required
def get_next_data(project_id, data_value):
    identity = get_jwt_identity()

    page = request.args.get("page", 1, type=int)
    active = request.args.get("active", "completed", type=str)

    try:
        request_user = User.query.filter_by(username=identity["username"]
                                            ).first()
        project = Project.query.get(project_id)
        project = Project.query.get(project_id)

        if request_user not in project.users:
            return jsonify(message="Unauthorized access!"), 401

        segmentations = db.session.query(Segmentation.data_id
                                         ).distinct().subquery()

        data = {}
        big_key = identity["username"]
        categories = ["pending", "completed"]
        data = retrieve_database(project_id, segmentations, categories,
                                 request_user, big_key)

        paginated_data_pending = data["pending"].paginate(page, 10, False)
        paginated_data_complet = data["completed"].paginate(page, 10, False)
        paginate_data = paginated_data_pending

        if (active != "pending"):
            for data_pt in paginated_data_complet.items:
                if data_pt.id == data_value:
                    active = "completed"
                    paginate_data = paginated_data_complet
                    break

        next_page = paginate_data.next_num if paginate_data.has_next else None
        prev_page = paginate_data.prev_num if paginate_data.has_prev else None
        response = list(
            [
                {
                    "data_id": data_point.id,
                    "filename": data_point.filename,
                    "original_filename": data_point.original_filename,
                    "created_on": data_point.created_at.strftime("%B %d, %Y"),
                    "is_marked_for_review": data_point.is_marked_for_review,
                    "number_of_segmentations": len(data_point.segmentations),
                    "sampling_rate": data_point.sampling_rate,
                    "clip_length": data_point.clip_length,
                }
                for data_point in paginate_data.items
            ]
        )
        count_data = {key: value.count() for key, value in data.items()}
    except Exception as e:
        return general_error("Error fetching all projects", e)

    return (
        jsonify(
            data=response,
            count=count_data,
            next_page=next_page,
            prev_page=prev_page,
            page=page,
            active=active,
        ),
        200,
    )


@api.route(
 "/current_user/projects/<int:project_id>/data/<int:dv>/page/<int:page_data>",
 methods=["GET"]
)
@jwt_required
def get_next_data2(project_id, dv, page_data):
    data_value = dv
    identity = get_jwt_identity()

    page = page_data
    active = request.args.get("active", "completed", type=str)

    try:
        request_user = User.query.filter_by(username=identity["username"]
                                            ).first()
        project = Project.query.get(project_id)
        project = Project.query.get(project_id)

        if request_user not in project.users:
            return jsonify(message="Unauthorized access!"), 401

        segmentations = db.session.query(Segmentation.data_id
                                         ).distinct().subquery()

        data = {}
        big_key = identity["username"]
        categories = ["pending", "completed"]
        data = retrieve_database(project_id, segmentations, categories,
                                 request_user, big_key)

        paginated_data_pending = data["pending"].paginate(page, 10, False)
        paginated_data_complet = data["completed"].paginate(page, 10, False)
        paginate_data = paginated_data_pending

        if (active != "pending"):
            for data_pt in paginated_data_complet.items:
                if data_pt.id == data_value:
                    active = "completed"
                    paginate_data = paginated_data_complet
                    break

        next_page = paginate_data.next_num if paginate_data.has_next else None
        prev_page = paginate_data.prev_num if paginate_data.has_prev else None
        response = list(
            [
                {
                    "data_id": data_point.id,
                    "filename": data_point.filename,
                    "original_filename": data_point.original_filename,
                    "created_on": data_point.created_at.strftime("%B %d, %Y"),
                    "is_marked_for_review": data_point.is_marked_for_review,
                    "number_of_segmentations": len(data_point.segmentations),
                    "sampling_rate": data_point.sampling_rate,
                    "clip_length": data_point.clip_length,
                }
                for data_point in paginate_data.items
            ]
        )
        count_data = {key: value.count() for key, value in data.items()}
    except Exception as e:
        return general_error("Error fetching all projects", e)

    return (
        jsonify(
            data=response,
            count=count_data,
            next_page=next_page,
            prev_page=prev_page,
            page=page,
            active=active,
        ),
        200,
    )


@api.route("/current_user/projects/get_all", methods=["GET"])
@jwt_required
def get_all():
    try:
        data = {}
        data["pending"] = (
            db.session.query(Data)
            .filter(or_(Data.sample != true(), Data.sample == null()))
            .distinct()
            .order_by(Data.last_modified.desc())
            .all()
        )
        paginated_data = data["pending"]
        response = []
        for data_point in paginated_data:
            date = ""
            if data_point.created_at is not None:
                date = data_point.created_at.strftime("%B %d, %Y")
            else:
                date = "N/a"
            new_data = {
                    "data_id": data_point.id,
                    "filename": data_point.filename,
                    "original_filename": data_point.original_filename,
                    "created_on": date,
                    "is_marked_for_review": data_point.is_marked_for_review,
                    "number_of_segmentations": len(data_point.segmentations),
                    "sampling_rate": data_point.sampling_rate,
                    "clip_length": data_point.clip_length,
                }
            response.append(new_data)
        count_data = {}
        count = 0
        for key in data:
            count += 1
            count_data[key] = count
    except Exception as e:
        return general_error("Error fetching all projects", e)

    return (jsonify(data=response, count=count_data), 200,)


@api.route("/current_user/projects/<int:project_id>/sample", methods=["GET"])
@jwt_required
def fetch_sample_for_project(project_id):
    identity = get_jwt_identity()

    try:
        request_user = User.query.filter_by(username=identity["username"]
                                            ).first()
        project = Project.query.get(project_id)

        if request_user not in project.users:
            return jsonify(message="Unauthorized access!"), 401

        segmentations = db.session.query(Segmentation.data_id
                                         ).distinct().subquery()
        # Lets set big id to the {username.idenity, username.id}
        # this would make it fast but aslo render serval data points
        data = {}
        big_key = identity["username"]
        # print(Data.assigned_user_id)
        # for key in Data.assigned_user_id:
        #    if request_user.id == Data.assigned_user_id[key]:
        #        big_key = key
        #        print(big_key, key)
        data["pending"] = (
            db.session.query(Data)
            .filter_by(sample=True)
            .filter(Data.project_id == project_id)
            .filter(Data.id.notin_(segmentations))
            .distinct()
            .order_by(Data.last_modified.desc())
        )

        paginated_data = data["pending"]
        response = []
        for data_point in paginated_data:
            date = ""
            if data_point.created_at is not None:
                date = data_point.created_at.strftime("%B %d, %Y")
            else:
                date = "N/a"
            new_data = {
                    "data_id": data_point.id,
                    "filename": data_point.filename,
                    "original_filename": data_point.original_filename,
                    "created_on": date,
                    "is_marked_for_review": data_point.is_marked_for_review,
                    "number_of_segmentations": len(data_point.segmentations),
                    "sampling_rate": data_point.sampling_rate,
                    "clip_length": data_point.clip_length,
                    "sample_label": data_point.sample_label,
                }
            response.append(new_data)
    except Exception as e:
        message = "Error fetching all data points"
        app.logger.error(message)
        app.logger.error(e)
        return jsonify(message=message), 501

    return (
            jsonify(
                data=response,
            ),
            200,
        )
