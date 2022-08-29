import React from 'react';
import Modal from 'react-bootstrap/Modal';
import CreateLabelValueForm from './forms/createLabelValueForm';
import EditLabelValueForm from './forms/editLabelValueForm';
import DeleteLabelValueForm from './forms/deleteLabelValueForm';

const FormModal = props => {
  const { show, onExited, onHide, title, formType, labelId, labelValueId } = props;
  return (
    <div>
      testing removal
    </div>
  );
};

export default FormModal;
