import React from 'react';
import {
  faEdit,
  faUserPlus,
  faTags,
  faDownload,
  faList,
  faTrash,
  faUpload
} from '@fortawesome/free-solid-svg-icons';
import { IconButton } from '../components/button';

/**
 * Admin portal requires a lot of data entry for forms
 * This generic method allows for simplifed rendering of diffrent kinds
 * of forms found on the admin portal
 */
class AdminHandleFormProjects extends React.Component {
  constructor(props) {
    super(props);
    this.adminProps = props.adminProps; 
    this.project = props.project;
    this.showDeletedProjects = props.showDeletedProjects;
    this.showModal = modalProps => {
      props.showModal(modalProps);
    };
  }

  /**
   * Redirects users to label page to create labels categories and values
   * @param {*} e 
   * @param {*} projectId 
   */
  handleAddLabelsToProject(e, projectId) {
    const { history } = this.adminProps;
    history.push(`/projects/${projectId}/labels`);
  }

  /**
   * Open Modal to Edit main project information handlers
   * @param {*} e 
   * @param {*} projectId 
   */
  handleEditProject(e, projectId) {
    this.showModal({
      formType: 'Edit_PROJECT',
      title: 'Edit Project',
      projectId
    });
  }

  /**
   * Open Modal to Add users to project
   * @param {*} e 
   * @param {*} projectId 
   */
  handleAddUsersToProject(e, projectId, projectName) {
    this.showModal({
      formType: 'MANAGE_PROJECT_USERS',
      title: `Project ${projectName}: Manage User Access`,
      projectId
    });
  }

  /**
   * Open Modal to data to a project from admin portal
   * @param {*} e 
   * @param {*} projectId 
   */
  handleUploadDataToProject(e, projectName, projectId, api_key) {
    this.showModal({
      formType: 'UPLOAD_DATA',
      title: `Project ${projectName}: Upload Project Audio Files`,
      projectId,
      projectName,
      api_key
    });
  }

  /**
   * Open Modal to download annotations for a given project
   * @param {*} e 
   * @param {*} projectId 
   */
  handleDownloadDataToProject(e, projectName, projectId, api_key) {
    this.showModal({
      formType: 'DOWNLOAD_DATA',
      title: `Project ${projectName}: DOWNLOAD ANNOTATIONS`,
      projectId,
      projectName,
      api_key
    });
  }

  /**
   * Open Modal to change toggleable features
   * @param {*} e 
   * @param {*} projectId 
   */
  handleFeatureToggle(e, projectName, projectId, api_key) {
    this.showModal({
      formType: 'FEATURE_FORM',
      title: `Toggle Features on or off for ${projectName}`,
      projectId,
      projectName,
      api_key
    });
  }

  /**
   * Render admin portal buttons for opening modal forms for editing
   * project state
   * @returns html for a row of icon buttons for a single project
   */
  render() {
    let adminHandleFormIcons;

    if (!this.showDeletedProjects) {
      adminHandleFormIcons = <td className="align-middle">
        <IconButton
          icon={faUserPlus}
          size="sm"
          title="Manage users"
          onClick={e => this.handleAddUsersToProject(e, this.project.project_id, this.project.name)}
        />
        <IconButton
          icon={faTags}
          size="sm"
          title="Manage labels"
          onClick={e => this.handleAddLabelsToProject(e, this.project.project_id)}
        />
        <IconButton
          icon={faEdit}
          size="sm"
          title="Edit Annotations"
          onClick={e => this.handleEditProject(e, this.project.project_id)}
        />
        <div />
        <IconButton
          icon={faUpload}
          size="sm"
          title="Upload Data"
          onClick={e =>
            this.handleUploadDataToProject(
              e,
              this.project.name,
              this.project.project_id,
              this.project.api_key
            )
          }
        />
        <IconButton
          icon={faDownload}
          size="sm"
          title="Download Data"
          onClick={e =>
            this.handleDownloadDataToProject(
              e,
              this.project.name,
              this.project.project_id,
              this.project.api_key
            )
          }
        />
        <IconButton
          icon={faList}
          size="sm"
          title="Turn on or Off Annotation Features"
          onClick={e =>
            this.handleFeatureToggle(
              e,
              this.project.name,
              this.project.project_id,
              this.project.api_key
            )
          }
        />
      </td>
    } else {
      adminHandleFormIcons = <td className="align-middle">
        <IconButton
          icon={faDownload}
          size="sm"
          title="Download Data"
          onClick={e =>
            this.handleDownloadDataToProject(
              e,
              this.project.name,
              this.project.project_id,
              this.project.api_key
            )
          }
        />
      </td>
    }
    return (
      adminHandleFormIcons
    );
  }
}

//TODO: ADD COMMENTS
class AdminHandleFormUsers extends React.Component {
  constructor(props) {
    super(props);
    this.user = props.user;
    this.showModal = modalProps => {
      props.showModal(modalProps);
    };
  }

  handleEditUser(e, userId) {
    this.showModal({ formType: 'EDIT_USER', title: 'Edit User', userId });
  }

  handleDeleteUser(e, userId) {
    // TODO: CREATE MODAL TO CONFIRM BUT FOR NOW MAKE DEV BUTTON
    this.showModal({ formType: 'DELETE_USER', title: 'Delete User', userId });
  }

  render() {
    return (
      <td className="align-middle">
        <IconButton
          icon={faEdit}
          size="sm"
          title="Edit user"
          onClick={e => this.handleEditUser(e, this.user.user_id)}
        />
        <IconButton
          icon={faTrash}
          size="sm"
          title="Delete User"
          onClick={e => this.handleDeleteUser(e, this.user.user_id)}
        />
      </td>
    );
  }
}

export { AdminHandleFormProjects, AdminHandleFormUsers };
