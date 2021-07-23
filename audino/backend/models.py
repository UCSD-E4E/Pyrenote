from werkzeug.security import generate_password_hash, check_password_hash

from backend import app, db

annotation_table = db.Table(
    "annotation",
    db.metadata,
    db.Column("id", db.Integer(), primary_key=True),
    db.Column(
        "segmentation_id",
        db.Integer(),
        db.ForeignKey("segmentation.id"),
        nullable=False,
    ),
    db.Column(
        "label_value_id", db.Integer(), db.ForeignKey("label_value.id"),
        nullable=False
    ),
    db.Column("created_at", db.DateTime(), nullable=False,
              default=db.func.now()),
    db.Column(
        "last_modified",
        db.DateTime(),
        nullable=False,
        default=db.func.now(),
        onupdate=db.func.utc_timestamp(),
    ),
)

user_project_table = db.Table(
    "user_project",
    db.metadata,
    db.Column("id", db.Integer(), primary_key=True),
    db.Column("user_id", db.Integer(), db.ForeignKey("user.id"),
              nullable=False),
    db.Column("project_id", db.Integer(), db.ForeignKey("project.id"),
              nullable=False),
    db.Column("created_at", db.DateTime(), nullable=False,
              default=db.func.now()),
    db.Column(
        "last_modified",
        db.DateTime(),
        nullable=False,
        default=db.func.now(),
        onupdate=db.func.utc_timestamp(),
    ),
)


class Data(db.Model):
    __tablename__ = "data"

    id = db.Column("id", db.Integer(), primary_key=True)

    project_id = db.Column(
        "project_id", db.Integer(), db.ForeignKey("project.id"), nullable=False
    )

    assigned_user_id = db.Column(
        "assigned_user_id", db.JSON(), nullable=False
    )

    filename = db.Column("filename", db.String(100), nullable=False,
                         unique=True)

    original_filename = db.Column("original_filename", db.String(100),
                                  nullable=False)

    is_marked_for_review = db.Column(
        "is_marked_for_review", db.Boolean(), nullable=False, default=False
    )

    created_at = db.Column(
        "created_at", db.DateTime(), nullable=False, default=db.func.now()
    )

    last_modified = db.Column(
        "last_modified",
        db.DateTime(),
        nullable=False,
        default=db.func.now(),
        onupdate=db.func.utc_timestamp(),
    )

    sampling_rate = db.Column("sampling_rate", db.Integer(), nullable=False)
    clip_length = db.Column("clip_length", db.Float(), nullable=False)

    project = db.relationship("Project")

    segmentations = db.relationship("Segmentation", backref="Data")

    def update_marked_review(self, marked_review):
        self.is_marked_for_review = marked_review

    def set_segmentations(self, segmentations):
        self.segmentations = segmentations

    def to_dict(self):
        return {
            "original_filename": self.original_filename,
            "filename": self.filename,
            "url": f"/audios/{self.filename}",
            "is_marked_for_review": self.is_marked_for_review,
            "created_at": self.created_at,
            "last_modified": self.last_modified,
            "assigned_users": self.assigned_user_id,
            "sampling_rate": self.sampling_rate,
            "clip_length": self.clip_length,
        }


class Label(db.Model):
    __tablename__ = "label"

    id = db.Column("id", db.Integer(), primary_key=True)

    name = db.Column("name", db.String(32), nullable=False)

    project_id = db.Column(
        "project_id", db.Integer(), db.ForeignKey("project.id"), nullable=False
    )

    type_id = db.Column(
        "type_id", db.Integer(), db.ForeignKey("label_type.id"), nullable=False
    )

    created_at = db.Column(
        "created_at", db.DateTime(), nullable=False, default=db.func.now()
    )

    last_modified = db.Column(
        "last_modified",
        db.DateTime(),
        nullable=False,
        default=db.func.now(),
        onupdate=db.func.utc_timestamp(),
    )

    label_type = db.relationship("LabelType", backref="Label")
    label_values = db.relationship("LabelValue", backref="Label")

    __table_args__ = (
        db.UniqueConstraint("name", "project_id", name="_name_project_id_uc"),
    )

    def set_label_type(self, label_type_id):
        self.type_id = label_type_id


class LabelType(db.Model):
    __tablename__ = "label_type"

    id = db.Column("id", db.Integer(), primary_key=True)

    type = db.Column("type", db.String(32), nullable=False, unique=True)

    created_at = db.Column(
        "created_at", db.DateTime(), nullable=False, default=db.func.now()
    )

    last_modified = db.Column(
        "last_modified",
        db.DateTime(),
        nullable=False,
        default=db.func.now(),
        onupdate=db.func.utc_timestamp(),
    )


class LabelValue(db.Model):
    __tablename__ = "label_value"

    id = db.Column("id", db.Integer(), primary_key=True)

    label_id = db.Column(
        "label_id", db.Integer(), db.ForeignKey("label.id"), nullable=False
    )

    value = db.Column("value", db.String(200), nullable=False)

    created_at = db.Column(
        "created_at", db.DateTime(), nullable=False, default=db.func.now()
    )

    last_modified = db.Column(
        "last_modified",
        db.DateTime(),
        nullable=False,
        default=db.func.now(),
        onupdate=db.func.utc_timestamp(),
    )

    __table_args__ = (
        db.UniqueConstraint("label_id", "value", name="_label_id_value_uc"),
    )

    label = db.relationship("Label", backref="LabelValue")
    segmentations = db.relationship(
        "Segmentation", secondary=annotation_table, back_populates="values"
    )

    def set_label_value(self, value):
        self.value = value


class Project(db.Model):
    __tablename__ = "project"

    id = db.Column("id", db.Integer(), primary_key=True)

    name = db.Column("name", db.String(32), nullable=False, unique=True)

    creator_user_id = db.Column(
        "creator_user_id", db.Integer(), db.ForeignKey("user.id"),
        nullable=False
    )

    api_key = db.Column("api_key", db.String(32), nullable=False, unique=True)

    created_at = db.Column(
        "created_at", db.DateTime(), nullable=False, default=db.func.now()
    )

    last_modified = db.Column(
        "last_modified",
        db.DateTime(),
        nullable=False,
        default=db.func.now(),
        onupdate=db.func.utc_timestamp(),
    )

    users = db.relationship(
        "User", secondary=user_project_table, back_populates="projects"
    )
    data = db.relationship("Data", backref="Project")
    labels = db.relationship("Label", backref="Project")
    creator_user = db.relationship("User")

    def set_name(self, newUsername):
        self.name = newUsername


class Role(db.Model):
    __tablename__ = "role"

    id = db.Column("id", db.Integer(), primary_key=True)

    role = db.Column("role", db.String(30), index=True, unique=True,
                     nullable=False)

    created_at = db.Column(
        "created_at", db.DateTime(), nullable=False, default=db.func.now()
    )

    last_modified = db.Column(
        "last_modified",
        db.DateTime(),
        nullable=False,
        default=db.func.now(),
        onupdate=db.func.utc_timestamp(),
    )


class Segmentation(db.Model):
    __tablename__ = "segmentation"

    id = db.Column("id", db.Integer(), primary_key=True)

    data_id = db.Column(
        "data_id", db.Integer(), db.ForeignKey("data.id"), nullable=False
    )

    start_time = db.Column("start_time", db.Float(), nullable=False)

    end_time = db.Column("end_time", db.Float(), nullable=False)

    created_at = db.Column(
        "created_at", db.DateTime(), nullable=False, default=db.func.now()
    )

    last_modified = db.Column(
        "last_modified",
        db.DateTime(),
        nullable=False,
        default=db.func.now(),
        onupdate=db.func.utc_timestamp(),
    )

    time_spent = db.Column(
        "time_spent", db.Float(), nullable=False, default=0.0
    )

    values = db.relationship(
        "LabelValue",
        secondary=annotation_table,
        back_populates="segmentations",
    )

    def set_start_time(self, start_time):
        self.start_time = start_time

    def set_end_time(self, end_time):
        self.end_time = end_time

    def set_time_spent(self, time):
        app.logger.info(time)
        time_spent = self.time_spent + time
        app.logger.info(self.time_spent)
        app.logger.info(time_spent)
        self.time_spent = time_spent

    def to_dict(self):
        return {
            "start_time": self.start_time,
            "end_time": self.end_time,
            "created_at": self.created_at,
            "last_modified": self.last_modified,
            "time_spent": self.time_spent
        }


class User(db.Model):
    __tablename__ = "user"

    id = db.Column("id", db.Integer(), primary_key=True)

    username = db.Column(
        "username", db.String(128), index=True, unique=True, nullable=False
    )

    password = db.Column("password", db.String(100), nullable=False)

    role_id = db.Column(
        "role_id", db.Integer(), db.ForeignKey("role.id"), nullable=False
    )

    created_at = db.Column(
        "created_at", db.DateTime(), nullable=False, default=db.func.now()
    )

    last_modified = db.Column(
        "last_modified",
        db.DateTime(),
        nullable=False,
        default=db.func.now(),
        onupdate=db.func.utc_timestamp(),
    )

    role = db.relationship("Role")
    projects = db.relationship(
        "Project", secondary=user_project_table, back_populates="users"
    )

    def set_role(self, role_id):
        self.role_id = role_id

    def set_username(self, newUsername):
        self.username = newUsername

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
