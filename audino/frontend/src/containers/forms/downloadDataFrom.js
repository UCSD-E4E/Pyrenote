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
  }



  handleDownloadAnnotationsCSV(e, projectName, projectId) {
    axios({
      method: "get",
      url: `/api/projects/${projectId}/annotations`,
      headers: {
        csv: "true",
      },
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
  _fake_click(obj) {
    let ev = document.createEvent("MouseEvents");
    ev.initMouseEvent(
      "click",
      true,
      false,
      window,
      0,
      0,
      0,
      0,
      0,
      false,
      false,
      false,
      false,
      0,
      null
    );
    obj.dispatchEvent(ev);
  }
  _export_raw(name, data) {
    
    let urlObject = window.URL || window.webkitURL || window;
    console.log(data)
    let export_blob = new Blob([data], {type : 'application/json'});
    console.log("ISSUE IS HERE")
    if ("msSaveBlob" in navigator) {
      navigator.msSaveBlob(export_blob, name);
    } else if ("download" in HTMLAnchorElement.prototype) {
      let save_link = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        "a"
      );
      save_link.href = urlObject.createObjectURL(export_blob);
      save_link.download = name;
      this._fake_click(save_link);
    } else {
      throw new Error("Neither a[download] nor msSaveBlob is available");
    }
  }

  handleDownloadAnnotationsJSON(e, projectName, projectId) {
    axios({
      method: "get",
      url: `/api/projects/${projectId}/annotations`,
      headers: {
        csv: "false",
      },
    })
      .then((response) => {
        console.log(response)
        console.log("response is good")
        console.log(response.data)
        console.log("response data is good")
        console.log(response.data.annotations)
        console.log("response data 2 is good")
        let annotations = response.data.annotations;
        if (annotations) {
          this._export_raw(
            `${projectName}.json`,
            JSON.stringify(annotations, null, 2)
          );
        } else {
          console.log("No annotations found");
        }
      })
      .catch((error) => {
        console.log(error)
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
         <form>
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
        <div class="col-1">
          <div className="row h-100 justify-content-center align-items-center">
            <IconButton
              icon={faDownload}
              size="lg"
              title={"Download Annotations - JSON"}
              onClick={(e) =>
                this.handleDownloadAnnotationsJSON(
                  e,
                  this.state.projectName,
                  this.state.projectId
                )
              }
            />
            <text>THIS IS A TEST</text>
          </div>
          <div className="row h-500000 justify-content-center align-items-center"></div>
          <div class="col-2">
            <IconButton
              icon={faDownload}
              size="lg"
              title={"Download Annotations - CSV"}
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
        </form>
      </div>
    );
  }
}

export default withStore(withRouter(DownloadDataForm));
