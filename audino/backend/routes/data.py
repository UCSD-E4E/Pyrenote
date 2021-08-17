import json
import sqlalchemy as sa
import uuid
from datetime import datetime
from pathlib import Path

from flask import jsonify, flash, redirect, url_for, request
from flask import send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.urls import url_parse
from werkzeug.utils import secure_filename
from werkzeug.exceptions import BadRequest, NotFound, InternalServerError

from backend import app, db
from backend.models import Data, Project, User, Segmentation, Label, LabelValue
import mutagen
import wave
from . import api

ALLOWED_EXTENSIONS = ["wav", "mp3", "ogg"]


@api.route("/audio/<path:file_name>", methods=["GET"])
@jwt_required
def send_audio_file(file_name):
    return send_from_directory(app.config["UPLOAD_FOLDER"], file_name)


def validate_segmentation(segment):
    """
    Validate the segmentation before accepting the annotation's upload
    from users
    """
    required_key = {"start_time", "end_time", "max_freq", "min_freq"}

    if set(required_key).issubset(segment.keys()):
        return True
    else:
        return False


def generate_segmentation(
    annotations,
    project_id,
    start_time,
    end_time,
    max_freq,
    min_freq,
    data_id,
    time_spent,
    username,
    segmentation_id=None,
):
    """Generate a Segmentation from the required segment information
    """
    app.logger.info(time_spent)
    if segmentation_id is None:
        segmentation = Segmentation(
            data_id=data_id,
            start_time=start_time,
            end_time=end_time,
            time_spent=time_spent,
            created_by=username,
            max_freq=max_freq,
            min_freq=min_freq,
        )
    else:
        # segmentation updated for existing data
        segmentation = Segmentation.query.filter_by(
            data_id=data_id, id=segmentation_id
        ).first()
        segmentation.set_start_time(start_time)
        segmentation.set_end_time(end_time)
        segmentation.set_time_spent(time_spent)
        segmentation.set_min_freq(min_freq)
        segmentation.set_max_freq(max_freq)

    segmentation.append_modifers(username)
    db.session.add(segmentation)
    db.session.flush()

    values = []

    for label_name, val in annotations.items():
        label = Label.query.filter_by(name=label_name, project_id=project_id
                                      ).first()

        if label is None:
            description = f"Label not found with name: `{label_name}`"
            raise NotFound(description=description)

        if "values" not in val:
            raise BadRequest(
                description=f"Key: `values` missing in Label: `{label_name}`"
            )

        label_values = val["values"]

        if isinstance(label_values, list):
            for val_id in label_values:
                value = LabelValue.query.filter_by(
                    id=int(val_id), label_id=int(label.id)
                ).first()

                if value is None:
                    err = f"label value id `{val_id}` not in `{label_name}`"
                    raise BadRequest(
                        description=err
                    )
                values.append(value)

        else:
            if label_values == "-1":
                continue

            value = LabelValue.query.filter_by(
                id=int(label_values), label_id=int(label.id)
            ).first()
            err = "no label value with id `{label_values}` in `{label_name}`"
            if value is None:
                raise BadRequest(
                    description=err
                )
            values.append(value)

    segmentation.values = values
    return segmentation


@api.route("/data", methods=["POST"])
def add_data():
    api_key = request.headers.get("Authorization", None)

    if not api_key:
        description = "API Key missing from `Authorization` Header"
        raise BadRequest(description=description)

    project = Project.query.filter_by(api_key=api_key).first()

    if not project:
        raise NotFound(description="No project exist with given API Key")

    username = request.form.getlist("username", None)
    username_id = {}
    for name in username:
        user = User.query.filter_by(username=name).first()

        if not user:
            raise NotFound(description="No user found with given username")

        username_id[name] = user.id

    segmentations = request.form.get("segmentations", "[]")
    is_marked_for_review = bool(request.form.get("is_marked_for_review",
                                                 False))
    audio_file = request.files["audio_file"]
    original_filename = secure_filename(audio_file.filename)
    sampling_rate = request.form.get("sampling_rate", 0)
    clip_length = request.form.get("clip_length", 0.0)

    extension = Path(original_filename).suffix.lower()

    if len(extension) > 1 and extension[1:] not in ALLOWED_EXTENSIONS:
        raise BadRequest(description="File format is not supported")

    filename = f"{str(uuid.uuid4().hex)}{extension}"

    file_path = Path(app.config["UPLOAD_FOLDER"]).joinpath(filename)
    audio_file.save(file_path.as_posix())
    try:
        data = Data(
            project_id=project.id,
            filename=filename,
            original_filename=original_filename,
            is_marked_for_review=is_marked_for_review,
            assigned_user_id=username_id,
            sampling_rate=sampling_rate,
            clip_length=clip_length,
        )
    except Exception as e:
        app.logger.info(e)
        raise BadRequest(description="username_id is bad ")
    print("HELLLO THERE ERROR MESSAGE")
    db.session.flush()

    segmentations = json.loads(segmentations)

    new_segmentations = []

    for segment in segmentations:
        validated = validate_segmentation(segment)

        if not validated:
            raise BadRequest(description=f"Segmentations have missing keys.")

        new_segment = generate_segmentation(
            data_id=data.id,
            project_id=project.id,
            end_time=segment["end_time"],
            start_time=segment["start_time"],
            max_freq=segment["max_freq"],
            min_freq=segment["min_freq"],
            annotations=segment.get("annotations", {}),
        )

        new_segmentations.append(new_segment)

    data.set_segmentations(new_segmentations)

    db.session.commit()
    db.session.refresh(data)

    return (
        jsonify(
            data_id=data.id,
            message=f"Data uploaded successfully",
            type="DATA_CREATED",
        ),
        201,
    )


@api.route("/data/admin_portal", methods=["POST"])
def add_data_from_site():
    app.logger.info(request.files)
    app.logger.info(request.form)
    api_key = request.form.get("apiKey", None)
    app.logger.info("also made it to asdfasdfasdfhere!")

    if not api_key:
        description = "API Key missing from `Authorization` Header"
        raise BadRequest(description=description)

    project = Project.query.filter_by(api_key=api_key).first()

    if not project:
        raise NotFound(description="No project exist with given API Key")

    app.logger.info("also made it to asdfasdfasdfhere!")
    username_txt = request.form.get("username", None)
    username = username_txt.split(",")
    username_id = {}
    for name in username:
        app.logger.info(name)
        user = User.query.first()
        app.logger.info(user)
        if not user:
            raise NotFound(description="No user found with given username")

        username_id[name] = user.id
    app.logger.info("also made it to asdfasdfasdfhere!")
    is_marked_for_review = True
    app.logger.info("made it to here!")
    is_sample = request.form.get("sample", 'False')
    sampleJson = request.form.get("sampleJson", "{}")
    is_sample = is_sample == 'true'
    
    if (is_sample):
        sampleJson = json.loads(sampleJson)

    err = "no label value with id `{is_sample}` in }`"
    app.logger.info(err)
    file_length = request.form.get("file_length", None)
    audio_files = []
    for n in range(int(file_length)):
        audio_files.append(request.files.get(str(n)))

    app.logger.info(audio_files)
    app.logger.info(audio_files)
    app.logger.info("also made it to here!")
    for file in audio_files:
        app.logger.info(file)
        original_filename = secure_filename(file.filename)

        sample_label = None
        if is_sample:
            sample_label = sampleJson[original_filename]
            
        extension = Path(original_filename).suffix.lower()

        if len(extension) > 1 and extension[1:] not in ALLOWED_EXTENSIONS:
            raise BadRequest(description="File format is not supported")

        filename = f"{str(uuid.uuid4().hex)}{extension}"

        file_path = Path(app.config["UPLOAD_FOLDER"]).joinpath(filename)
        file.save(file_path.as_posix())
        metadata = mutagen.File(file_path.as_posix()).info
        frame_rate = metadata.sample_rate
        clip_duration = metadata.length
        try:
            data = Data(
                project_id=project.id,
                filename=filename,
                original_filename=original_filename,
                is_marked_for_review=is_marked_for_review,
                assigned_user_id=username_id,
                sampling_rate=frame_rate,
                clip_length=clip_duration,
                sample=is_sample,
                sample_label=sample_label
            )
            app.logger.info(filename)
        except Exception as e:
            raise BadRequest(description="username_id is bad ")
        db.session.add(data)
        db.session.flush()
        db.session.commit()
        db.session.refresh(data)

    return (
        jsonify(
            message=f"Data uploaded successfully",
            type="DATA_CREATED",
        ),
        201,
    )


@api.route("/projects/<int:project_id>/data/<int:data_id>/confident_check",
           methods=["POST"])
@jwt_required
def set_confident_check_data(project_id, data_id):
    identity = get_jwt_identity()
    confident_check = request.json.get("confidentCheck")
    
    try:
        app.logger.info("hello")
        request_user = User.query.filter_by(username=identity["username"]
                                            ).first()
        app.logger.info("hello")
        project = Project.query.get(project_id)
        if request_user not in project.users:
            return jsonify(message="Unauthorized access!"), 401
        app.logger.info("hello")
        data = (
            db.session.query(Data)
            .filter(Data.project_id == project_id)
            .filter(Data.id == data_id)
            .first()
        )
        if data is None:
            return jsonify(message="Wrong Data ID"), 401
        app.logger.info("hello")
        data.set_confident_check(confident_check)
        app.logger.info("hello")
        db.session.add(data)
        db.session.commit()
        db.session.refresh(data)
    except Exception as e:
        app.logger.info(e)
        return jsonify(message="errors!!!!!"), 500

    return jsonify(message="SUCCESS"), 200
