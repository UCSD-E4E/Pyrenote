import React from 'react';
import axios from 'axios';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { IconButton } from '../../components/button';
import { FormAlerts } from '../../components/alert';
import { errorLogger } from '../../logger';
import Loader from '../../components/loader';

class DownloadDataForm extends React.Component {
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
      projectUrl: `/api/projects/${projectId}`,
      getUsersUrl: '/api/users',
      uploadUrl: 'api/data/admin_portal',
      updateUsersProject: `/api/projects/${projectId}/users`,
      files: {}
    };

    this.state = { ...this.initialState };
  }

  componentDidMount() {}

  handleDownloadAnnotationsCSV(e, projectName, projectId) {
    axios({
      method: 'get',
      url: `/api/projects/${projectId}/annotations`,
      headers: {
        csv: 'true'
      }
    })
      .then(response => {
        const { annotations } = response.data;
        if (annotations) {
          const data = annotations; // JSON.stringify(annotations, null, 2)
          try {
            let csvContent = '';
            data.forEach((infoArray, index) => {
              // REMOVED FUNCTION HERE, ADD FUNCTION WORD SEAN
              const dataString = infoArray.join(',');
              csvContent += index < data.length ? `${dataString}\n` : dataString;
            });
            this.download(csvContent, `${projectName}.csv`, 'text/csv;encoding:utf-8');
          } catch (c) {
            errorLogger.sendLog(c.response.data.message)
            console.error(c);
          }
        } else {
          console.warn('No annotations found');
        }
      })
      .catch(error => {
        errorLogger.sendLog(error.response.data.message)
        this.setState({
          errorMessage: error.response.data.message
        });
      });
  }

  handleDownloadAnnotationsRaven(e, projectName, projectId) {
    axios({
      method: 'get',
      url: `/api/projects/${projectId}/annotations`,
      headers: {
        csv: 'raven-test'
      }
    })
      .then(response => {
       

        const { annotations } = response.data;
        if (annotations) {
          const data = annotations; // JSON.stringify(annotations, null, 2)
          let zip = new JSZip();
          data.forEach(file => {
            zip.file(file["original_filename"], file["annotations"]);
          })
          zip.generateAsync({type: "blob"}).then(function(content) {
            FileSaver.saveAs(content, "raven_annotations.zip");
          });
        } else {
          console.warn('No annotations found');
        }
      })
      .catch(error => {
        this.setState({
          errorMessage: error.response.data.message
        });
      });
  }

  handleDownloadAnnotationsJSON(e, projectName, projectId) {
    axios({
      method: 'get',
      url: `/api/projects/${projectId}/annotations`,
      headers: {
        csv: 'false'
      }
    })
      .then(response => {
        const { annotations } = response.data;
        if (annotations) {
          this._export_raw(`${projectName}.json`, JSON.stringify(annotations, null, 2));
        } else {
          console.warn('No annotations found');
        }
      })
      .catch(error => {
        errorLogger.sendLog(error.response.data.message)
        console.error(error);
        this.setState({
          errorMessage: error.response.data.message
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

  _fake_click(obj) {
    const ev = document.createEvent('MouseEvents');
    ev.initMouseEvent(
      'click',
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
    const urlObject = window.URL || window.webkitURL || window;
    const export_blob = new Blob([data], { type: 'application/json' });
    if ('msSaveBlob' in navigator) {
      navigator.msSaveBlob(export_blob, name);
    } else if ('download' in HTMLAnchorElement.prototype) {
      const save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
      save_link.href = urlObject.createObjectURL(export_blob);
      save_link.download = name;
      this._fake_click(save_link);
    } else {
      errorLogger.sendLog('Neither a[download] nor msSaveBlob is available')
      throw new Error('Neither a[download] nor msSaveBlob is available');
    }
  }

  download(content, fileName, mimeType)  {
    const a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';

    if (navigator.msSaveBlob) {
      // IE10
      navigator.msSaveBlob(
        new Blob([content], {
          type: mimeType
        }),
        fileName
      );
    } else if (URL && 'download' in a) {
      // html5 A[download]
      a.href = URL.createObjectURL(
        new Blob([content], {
          type: mimeType
        })
      );
      a.setAttribute('download', fileName);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.location.href = `data:application/octet-stream,${encodeURIComponent(
        content
      )}`; // only this mime type is supported
    }
  };

  downloadZIP() {

  }

  resetState() {
    this.setState(this.initialState);
  }

  render() {
    const { errorMessage, successMessage, isLoading, projectName, projectId } = this.state;
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
        <div className="row h-50 justify-content-center align-items-center">
          <div
            style={{
              float: 'left',
              width: '30%'
            }}
          >
            <text>DOWNLOAD JSON</text>
            <IconButton
              icon={faDownload}
              size="lg"
              title="Download Annotations - JSON"
              onClick={e => this.handleDownloadAnnotationsJSON(e, projectName, projectId)}
            />
          </div>
          <div
            style={{
              float: 'left',
              width: '30%'
            }}
          >
            <text>DOWNLOAD CSV</text>
            <IconButton
              icon={faDownload}
              size="lg"
              title="Download Annotations - CSV"
              onClick={e => this.handleDownloadAnnotationsCSV(e, projectName, projectId)}
            />
          </div>
          <div
            style={{
              float: 'right',
              width: '30%'
            }}
          >
            <text>DOWNLOAD RAVEN </text>
            <IconButton
              icon={faDownload}
              size="lg"
              title="Download Annotations - RAVEN"
              onClick={e => this.handleDownloadAnnotationsRaven(e, projectName, projectId)}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default DownloadDataForm;
