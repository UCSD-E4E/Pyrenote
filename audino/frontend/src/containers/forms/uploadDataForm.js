import React from 'react';
import axios from 'axios';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';

import Alert from '../../components/alert';
import { Button } from '../../components/button';
import Loader from '../../components/loader';

class UploadDataForm extends React.Component {
  constructor(props) {
    super(props);

    const projectId = Number(this.props.projectId);

    this.initialState = {
      apiKey: this.props.apiKey,
      projectId,
      projectName: this.props.projectName,
      errorMessage: '',
      successMessage: '',
      isLoading: false,
      isSubmitting: false,
      projectUrl: `/api/projects/${projectId}`,
      getUsersUrl: '/api/users',
      uploadUrl: 'api/data/admin_portal',
      updateUsersProject: `/api/projects/${projectId}/users`,
      files: {}
    };

    this.state = { ...this.initialState };
  }

  componentDidMount() {
    /* const { uploadUrl } = this.state;

    this.setState({ isLoading: true });

    axios
      .all([axios.get(projectUrl), axios.get(getUsersUrl)])
      .then((response) => {
        const selectedUsers = response[0].data.users.map((user) =>
          Number(user["user_id"])
        );
        this.setState({
          selectedUsers,
          users: response[1].data.users,
          isLoading: false,
        });
      }); */
  }

  resetState() {
    this.setState(this.initialState);
  }

  handleUpload(e) {
    const { uploadUrl, apiKey, files } = this.state;
    console.log(apiKey);
    console.log('hello?');
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      formData.append(i, file);
    }
    formData.append('apiKey', apiKey);
    formData.append('username', ['admin', 'admin']);
    formData.append('file_length', files.length);
    /*
    var formData = new FormData();
    var imagefile = document.querySelector('#file');
    formData.append("image", imagefile.files[0]);
    axios.post('upload_file', formData, {
        headers: {
        'Content-Type': 'multipart/form-data'
        }
    })
    */
    // console.log(file)
    /* axios({
      method: "post",
      url: uploadUrl,
      form: formData,
      headers: { "Content-Type": "multipart/form-data" },
      
    })
      .then((response) => {
        this.setState({
          isSubmitting: false,
          successMessage: response.data.message,
          errorMessage: null,
        });
      })
      .catch((error) => {
        this.setState({
          isSubmitting: false,
          errorMessage: error.response.data.message,
          successMessage: "",
        });
      }); */
    this.setState({ isLoading: true });
    fetch(uploadUrl, {
      method: 'POST',
      body: formData
    }).then(response => {
      const data = response.json();
      console.log(data);
      data.then(data => {
        console.log(data);
        if (data.code != 201 && data.type != 'DATA_CREATED') {
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

  onChangeHandler(e) {
    console.log(e.target.files);
    this.setState({ files: e.target.files });
  }

  handleAlertDismiss(e) {
    e.preventDefault();
    this.setState({
      successMessage: '',
      errorMessage: ''
    });
  }

  render() {
    const { isSubmitting, errorMessage, successMessage, users, selectedUsers, isLoading } =
      this.state;
    return (
      <div className="container h-75 text-center">
        <div>
          {isLoading ? <Loader /> : null}
          {errorMessage ? (
            <Alert type="danger" message={errorMessage} onClose={e => this.handleAlertDismiss(e)} />
          ) : null}
          {successMessage ? (
            <Alert
              type="success"
              message={successMessage}
              onClose={e => this.handleAlertDismiss(e)}
            />
          ) : null}
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
                onClick={e => this.handleUpload(e)}
                isSubmitting={isSubmitting}
                alt="Uploading"
                text="Upload"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withStore(withRouter(UploadDataForm));
