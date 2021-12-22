from flask import jsonify, request

from backend import app, db
from backend.models import User, Data
from sqlalchemy.sql.expression import false, true, null
from sqlalchemy import or_

## List of data to get for user
## show list of last 10 data points of annotations completed
## Username
## pfp picture?
## Number of annotations created by each users per project
## get all annotations completed by users *****
## 


@api.route("/user_data", methods=["GET"])
@jwt_required
def fetch_user_data()):
    identity = get_jwt_identity()
    request_user = User.query.filter_by(username=identity["username"]
                                        ).first()
    if (request_user is None)
        return "failed", 404
    
    return "success", 200

@api.route("/user_data_annotations", methods=["GET"])
@jwt_required
def get_user_annotations_api():
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

def get_user_annotations(user):
    return {"test": user.username}
