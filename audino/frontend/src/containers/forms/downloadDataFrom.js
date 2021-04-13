import React from "react";
import axios from "axios";
import { withRouter } from "react-router";
import { withStore } from "@spyna/react-store";
import { IconButton } from "../../components/button";
import {
  faPlusSquare,
  faEdit,
  faUserPlus,
  faTags,
  faDownload,
  faTrash,
  faUpload
} from "@fortawesome/free-solid-svg-icons";
import Alert from "../../components/alert";
import { Button } from "../../components/button";
import Loader from "../../components/loader";

class DownloadDataForm extends React.Component {
  constructor(props) {
    super(props);

    const projectId = Number(this.props.projectId);

    this.initialState = {
      apiKey: this.props.apiKey,
      projectId,
      projectName: this.props.projectName,
      errorMessage: "",
      successMessage: "",
      isLoading: false,
      isSubmitting: false,
      projectUrl: `/api/projects/${projectId}`,
      getUsersUrl: "/api/users",
      uploadUrl: "api/data/admin_portal",
      updateUsersProject: `/api/projects/${projectId}/users`,
      files: {},
    };

    this.state = Object.assign({}, this.initialState);
  }

  componentDidMount() {
    /*const { uploadUrl } = this.state;

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
      });*/
  }

  handleDownloadAnnotationsCSV(e, projectName, projectId) {
    axios({
      method: "get",
      url: `/api/projects/${projectId}/annotations`,
    })
      .then((response) => {
        const { annotations } = response.data;
        if (annotations) {
          var data = annotations;//JSON.stringify(annotations, null, 2)
          console.log(data)
          try {
            var csvContent = '';
            data.forEach(function(infoArray, index) {
              var dataString = infoArray.join(',');
              csvContent += index < data.length ? dataString + '\n' : dataString;
            });

            /*var csvContent = "data:text/csv;charset=utf-8,";
            //console.log(type(data))
            data.forEach(function(infoArray, index) {
              var dataString = infoArray.join(',');
              console.log(infoArray)
              console.log(dataString)
              csvContent += dataString + '\n'
              console.log(csvContent)
              console.log("===========================================")
              //https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
              //TODO: USE DOWNLOAD METHOD HERE
            });
            this._export_raw(`${projectName}.csv`, data);*/
            var download = function(content, fileName, mimeType) {
              var a = document.createElement('a');
              mimeType = mimeType || 'application/octet-stream';
            
              if (navigator.msSaveBlob) { // IE10
                navigator.msSaveBlob(new Blob([content], {
                  type: mimeType
                }), fileName);
              } else if (URL && 'download' in a) { //html5 A[download]
                a.href = URL.createObjectURL(new Blob([content], {
                  type: mimeType
                }));
                a.setAttribute('download', fileName);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              } else {
                window.location.href = 'data:application/octet-stream,' + encodeURIComponent(content); // only this mime type is supported
              }
            }
            download(csvContent, `${projectName}.csv`, 'text/csv;encoding:utf-8');
          } catch(e) {
            console.log(e)
            //this._export_raw(`${projectName}.csv`, data);
          }  
        } else {
          console.log("No annotations found");
        }
      })
      .catch((error) => {
        this.setState({
          errorMessage: error.response.data.message,
          isUserLoading: false,
        });
      });
  }

  resetState() {
    this.setState(this.initialState);
  }

  handleUpload(e) {
    
  }

  onChangeHandler(e) {
    console.log(e.target.files)
    this.setState({files: e.target.files})
  }

  handleAlertDismiss(e) {
    e.preventDefault();
    this.setState({
      successMessage: "",
      errorMessage: "",
    });
  }

  render() {
    const {
      isSubmitting,
      errorMessage,
      successMessage,
      users,
      selectedUsers,
      isLoading,
    } = this.state;
    return (
      <div className="container h-75 text-center">
        <div>
          {isLoading ? <Loader />: null}
            {errorMessage ? (
              <Alert
                type="danger"
                message={errorMessage}
                onClose={(e) => this.handleAlertDismiss(e)}
              />
            ) : null}
            {successMessage ? (
              <Alert
                type="success"
                message={successMessage}
                onClose={(e) => this.handleAlertDismiss(e)}
              />
            ) : null}
          </div>
        <div className="row h-100 justify-content-center align-items-center">
          <div className="row h-100 justify-content-center align-items-center">
            <text>DOWNLOAD CSV</text>
            <IconButton
              icon={faDownload}
              size="sm"
              title={"Download Annotations"}
              onClick={(e) =>
                this.handleDownloadAnnotationsCSV(
                  e,
                  this.state.projectName,
                  this.state.projectId
                )
              }
            />
          </div>
          <div className="row h-100 justify-content-center align-items-center">
            <text>DOWNLOAD JSON</text>
            <IconButton
              icon={faDownload}
              size="sm"
              title={"Download Annotations"}
              onClick={(e) =>
                this.handleDownloadAnnotationsCSV(
                  e,
                  this.state.projectName,
                  this.state.projectId
                )
              }
            />
          </div>
        </div>
      </div>
    );
  }
}

export default withStore(withRouter(DownloadDataForm));
