import React from 'react';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';

import { FormAlerts } from '../../components/alert';
import { Button } from '../../components/button';
import Loader from '../../components/loader';
import { text } from '@fortawesome/fontawesome-svg-core';

class UploadDataForm extends React.Component {
  constructor(props) {
    super(props);
    let { projectId } = this.props;
    const { apiKey, projectName } = this.props;
    projectId = Number(projectId);

    this.initialState = {
      apiKey,
      projectId,
      projectName,
      errorMessage: '',
      successMessage: '',
      isLoading: false,
      isSubmitting: false,
      isSample: false,
      projectUrl: `/api/projects/${projectId}`,
      getUsersUrl: '/api/users',
      uploadUrl: 'api/data/admin_portal',
      updateUsersProject: `/api/projects/${projectId}/users`,
      value: "",
      files: {}
    };

    this.state = { ...this.initialState };
  }

  handleUpload(sample=false) {
    const { uploadUrl, apiKey, files, value } = this.state;
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      formData.append(i, file);
    }
    formData.append('apiKey', apiKey);
    formData.append('username', ['admin', 'admin']);
    formData.append('file_length', files.length);
    formData.append('sample', sample);
    formData.append('sampleJson', value);
    this.setState({ isLoading: true });
    fetch(uploadUrl, {
      method: 'POST',
      body: formData
    }).then(response => {
      const msg = response.json();
      msg.then(data => {
        if (data.code !== 201 && data.type !== 'DATA_CREATED') {
          this.setState({
            isSubmitting: false,
            errorMessage: data.message,
            successMessage: null,
            isLoading: false
          });
        } else {
          this.setState({
            isSubmitting: false,
            successMessage: data.message,
            errorMessage: null,
            isLoading: false,
            files: {}
          });
        }
      });
    });
  }

  handleAlertDismiss(e) {
    e.preventDefault();
    this.setState({
      successMessage: '',
      errorMessage: ''
    });
  }

  onChangeHandler(e) {
    let files = e.target.files
    console.log(files, typeof(files))
    this.setState({ files});
    let text = "{\n"
    Array.prototype.forEach.call(files, file => {
      text = text + " \"" + file.name + "\":           , \n"
    })
    text = text + "}"
    this.setState({ files, value: text});

    /*const jsonEditor = document.getElementById("json_editor");
    console.log(jsonEditor, jsonEditor.style.height, jsonEditor.scrollHeight)
    jsonEditor.style.height = jsonEditor.scrollHeight + "px"*/

  }

  handleChangeText(e) {
    this.setState({value: e.target.value});
  }

  resetState() {
    this.setState(this.initialState);
  }

  render() {
    const { isSubmitting, errorMessage, successMessage, isLoading, isSample, value } = this.state;
    return (
      <div className="container h-75 text-center">
        <div>
          {isLoading ? <Loader /> : null}
          <FormAlerts
            errorMessage={errorMessage}
            successMessage={successMessage}
            callback={e => this.handleAlertDismiss(e)}
          />
        </div>
        <div className="row h-100 justify-content-center align-items-center">
          <input
            type="file"
            name="file"
            onChange={e => {
              this.onChangeHandler(e);
            }}
            multiple
          />
          <div className="form-row">
            <div className="form-group col">
            <Button
                size="lg"
                type="primary"
                disabled={isSubmitting}
                onClick={() => this.setState({isSample: !isSample})}
                text={isSample? "This is a sample data uplaod" : "not a sample data upload" }
              />
              <Button
                size="lg"
                type="primary"
                disabled={isSubmitting}
                onClick={() => this.handleUpload(isSample)}
                isSubmitting={isSubmitting}
                alt="Uploading"
                text="Upload"
              />
            </div>
          </div>
        </div>
        <div className="row h-100 justify-content-center align-items-center">
        {isSample? 
        <label style={{width: "200%"}}>
          <textarea id="json_editor" value={value} onChange={e => this. handleChangeText(e)} style={{width: "100%", height: "200px"}} />
        </label> : null }
        </div>
      </div>
    );
  }
}

export default withStore(withRouter(UploadDataForm));
