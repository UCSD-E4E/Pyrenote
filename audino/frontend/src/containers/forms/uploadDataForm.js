import React from 'react';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';
import { FormAlerts } from '../../components/alert';
import { Button } from '../../components/button';
import Loader from '../../components/loader';
import {LoadingBar} from '../../components/loader';

/**
 * UploadDataForm
 * 
 * Form for uploading audio files to backend from the frontend
 * Renders in Admin Portal
 */
class UploadDataForm extends React.Component {
  constructor(props) {
    super(props);
    
    //get props passed in from modal props
    let { projectId } = this.props;
    const { apiKey, projectName } = this.props;
    projectId = Number(projectId);

    this.initialState = {
      //save key props
      apiKey,
      projectId,
      projectName,
      
      //message states
      errorMessage: '',
      successMessage: '',
      
      //flags
      isLoading: false,
      isSubmitting: false,
      isSample: false,

      //url handlers
      projectUrl: `/api/projects/${projectId}`,
      getUsersUrl: '/api/users',
      uploadUrl: 'api/data/admin_portal',
      updateUsersProject: `/api/projects/${projectId}/users`,
      
      //file upload state vars
      value: '',
      files: {},
      currentFile: 0
    };

    this.state = { ...this.initialState };
  }

  /**
   * Handle the data upload to backend
   * @param {*} sample if the data are sample files for the refrence window feature
   * @param {*} start starting index of files to upload, for recursion
   * @param {*} chunk the num of files each batch to upload at a time
   */
  handleUpload(sample = false, start = 0, chunk = 5) {
    //var set up
    //note: files contains all files to upload
    const { uploadUrl, apiKey, files, value } = this.state;
    //formData is what we will upload to backend
    //https://developer.mozilla.org/en-US/docs/Web/API/FormData
    const formData = new FormData();
    
    //Set up start of loop
    let isThereMoreData = true;
    let i = start
    let count = 0
    for (; i < files.length && i - start < chunk; i++) {
      //for all files in this batch, save them to formData
      const file = files[i];
      console.log(i, file, count)
      formData.append(count, file);
      count++
    }

    //check if we need to recurse to add more data to the system after this batch uploads
    if (i >= files.length) {
      isThereMoreData = false
    }

    //Add metadata so backend knows where to add this data to
    //as well as extra data to help it process info, see INSERT FILE HERE
    formData.append('apiKey', apiKey);
    formData.append('username', ['admin', 'admin']);
    formData.append('file_length', count);

    //let the backend know if this batch are of samples
    formData.append('sample', sample);
    formData.append('sampleJson', value);
    this.setState({ isLoading: true, currentFile: i });

    //Uploads this batch to backend
    fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      //fun fact: formData doesn't include access_token in the header by default
      //This is still secure since Pyrenote is https only.
      headers: {
        Authorization: localStorage.getItem('access_token')
      }
    }).then(response => {
      //Check to make sure backend worked out because its file io and file io :)
      const msg = response.json();
      msg.then(data => {
        //Something went horribly wrong
        if (data.code !== 201 && data.type !== 'DATA_CREATED') {
          this.setState({
            isSubmitting: false,
            errorMessage: data.message,
            successMessage: null,
            isLoading: false
          });

        //Assuming nothing went wrong... upload the next batch
        } else {
          if (isThereMoreData) {
            console.log("next upload", i, chunk)
            this.handleUpload(sample, i, chunk)
          } 
          //This implies there is no more data to upload! Lets stop the upload.
          else {
            this.setState({
              isSubmitting: false,
              successMessage: data.message,
              errorMessage: null,
              isLoading: false,
              files: {},
              currentFile: 0,
            });
          }
        }
      });
    });
  }

  /**
   * handler to dismiss error/success messages
   * @param {*} e 
   */
  handleAlertDismiss(e) {
    e.preventDefault();
    this.setState({
      successMessage: '',
      errorMessage: ''
    });
  }

  /**
   * Handle adding sample data json
   * @param {*} e 
   */
  handleChangeText(e) {
    this.setState({ value: e.target.value });
  }

  /**
   * Handle the user selecting which file to upload
   * @param {*} e 
   */
  onChangeHandler(e) {
    const files = e.target.files;
    this.setState({ files });

    //for sample text, add a placeholder to json
    //so users can add a weakly labeled data to it
    let text = '{\n';
    Array.prototype.forEach.call(files, file => {
      text = `${text} "${file.name}":           , \n`;
    });
    text += '}';
    this.setState({ files, value: text });
  }

  /**
   * Render the form
   * @returns html for form
   */
  render() {
    const { isSubmitting, errorMessage, successMessage, isLoading, isSample, value, files, currentFile } = this.state;
    return (
      <div className="container h-75 text-center">
        <div>
          {isLoading ? <Loader/> : null}
          <LoadingBar total={files.length} current={currentFile} />
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
                onClick={() => this.setState({ isSample: !isSample })}
                text={isSample ? 'This is a sample data upload' : 'Not a sample data upload'}
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
          {isSample ? (
            <label style={{ width: '200%' }}>
              <textarea
                id="json_editor"
                value={value}
                onChange={e => this.handleChangeText(e)}
                style={{ width: '100%', height: '200px' }}
              />
            </label>
          ) : null}
        </div>
      </div>
    );
  }
}

export default withStore(withRouter(UploadDataForm));
