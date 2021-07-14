import React from 'react';
import Modal from 'react-bootstrap/Modal';
import UploadDataForm from './forms/uploadDataForm';
import CreateUserForm from './forms/createUserForm';
import EditUserForm from './forms/editUserForm';
import CreateProjectForm from './forms/createProjectForm';
import CreateLabelForm from './forms/createLabelForm';
import EditLabelForm from './forms/editLabelForm';
import ManageUsersProjectForm from './forms/manageUsersProjectForm';
import CreateLabelValueForm from './forms/createLabelValuelForm';
import EditLabelValueForm from './forms/editLabelValueForm';
import DeleteLabelValueForm from './forms/deleteLabelValueFrom';
import DeleteUserForm from './forms/deleteUser';
import DeleteLabelForm from './forms/deleteLabelFrom';
import EditProjectForm from './forms/editProjectForm';
import DownloadDataForm from './forms/downloadDataFrom';

const FormModal = props => {
  const {
    show,
    onExited,
    onHide,
    title,
    formType,
    userId,
    projectId,
    labelId,
    labelValueId,
    api_key,
    projectName
  } = props;
  return (
    <Modal
      show={show}
      onExited={onExited}
      onHide={onHide}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.formType === "NEW_LABEL_VALUE" ? (
          <CreateLabelValueForm labelId={props.labelId} />
        ) : null}
        {props.formType === "EDIT_LABEL_VALUE" ? (
          <EditLabelValueForm
            labelId={props.labelId}
            labelValueId={props.labelValueId}
          />
        ) : null}
        {props.formType === "DELETE_LABEL_VALUE" ? (
          <DeleteLabelValueForm
            labelId={props.labelId}
            labelValueId={props.labelValueId}
            onDelete={props.onExited}
          />
        ) : null}
        {props.formType === "DELETE_LABEL" ? (      
          <DeleteLabelForm
            labelId={props.labelId}
            projectId={props.projectId}
            onDelete={props.onExited}
            />
        ) : null}
        {props.formType === "UPLOAD_DATA" ? (
          <UploadDataForm
            projectId={props.projectId}
            projectName={props.projectName}
            apiKey={props.api_key}
          />
        ) : null}
        {props.formType === "DOWNLOAD_DATA" ? (
          <DownloadDataForm
            projectId={props.projectId}
            projectName={props.projectName}
            apiKey={props.api_key}
          />
        ) : null}
      </Modal.Body>
    </Modal>
  );
};

export default FormModal;
