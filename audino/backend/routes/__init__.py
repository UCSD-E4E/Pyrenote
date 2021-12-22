from .api_calls import api, auth
from .login import (
    check_if_token_is_revoked,
    my_expired_token_callback,
    login,
    is_logged_in,
    logout
)
from .users import (
    create_user,
    create_user_no_auth,
    fetch_user,
    update_user,
    delete_user,
    fetch_all_users
)
from .projects import (
    generate_api_key,
    create_project,
    fetch_all_projects,
    fetch_project,
    edit_project,
    update_project_users,
    give_users_examples,
    get_project_annotations
)

from .project_segmentations import (
    get_segmentations_for_data,
    add_segmentations,
    delete_segmentations,
)

from .project_labels import (
    add_label_to_project,
    get_label_for_project,
    update_label_for_project,
    get_labels_for_project,

)

from .labels import (
    add_value_to_label,
    get_values_for_label,
    add_value_to_label_from_file,
    fetch_label_value,
    delete_label_value,
    update_value_for_label,
    delete_label
)
from .current_user import (
    fetch_current_user_projects,
    fetch_data_for_project,
    get_next_data,
    get_next_data2,
    get_all
)
from .data import (
    send_audio_file,
    validate_segmentation,
    generate_segmentation,
    add_data,
    add_data_from_site,
    update_data,
)
from .audios import send_audio_file

from .next_clip import (
    getNextReccomendedData, getNextClip, get_next_data_unknown
)

from .user_data import (
    get_self_annotations, get_requested_user_annotations, fetch_user_data
)
