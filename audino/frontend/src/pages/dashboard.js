import axios from 'axios';
import React from 'react';
import { Helmet } from 'react-helmet';
import { Button, IconButton } from '../components/button';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import Loader from '../components/loader';
import { errorLogger } from '../logger';
import Modal from 'react-bootstrap/Modal';
import { FormAlerts } from '../components/alert';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      isProjectLoading: false,
      show: false,
      errorMessage: "",
      successMessage: "",
      apicode: "",

    };
  }

  componentDidMount() {
    this.setState({ isProjectLoading: true });

    axios({
      method: 'get',
      url: '/api/current_user/projects'
    })
      .then(response => {
        this.setState({
          projects: response.data.projects,
          isProjectLoading: false
        });
      })
      .catch(e => {
        this.setState({
          isProjectLoading: false
        });
        errorLogger.sendLog(`Something went wrong with the upload${e.response.data.message}`);
      });
  }

  getReccomendedData(projectId) {
    axios({
      method: 'get',
      url: `api/next_clip/next_rec/project/${projectId}/data/1`
    })
      .then(response => {
        if (response.status == 200) {
          const index = window.location.href.indexOf('/dashboard');
          const path = window.location.href.substring(0, index);
          localStorage.setItem('active', 'recommended');
          localStorage.setItem('previous_links', JSON.stringify([]));
          localStorage.setItem('count', JSON.stringify(0));
          window.location.href = `${path}/projects/${projectId}/data/${response.data.data_id}/annotate`;
        } 
      })
      .catch(() => {
        this.setState({
          isProjectLoading: false
        });
      });
  }


  getReccomendedData(projectId) {
    axios({
      method: 'get',
      url: `api/next_clip/next_rec/project/${projectId}/data/1`
    })
      .then(response => {
        if (response.status == 200) {
          const index = window.location.href.indexOf('/dashboard');
          const path = window.location.href.substring(0, index);
          localStorage.setItem('active', 'recommended');
          localStorage.setItem('previous_links', JSON.stringify([]));
          localStorage.setItem('count', JSON.stringify(0));
          window.location.href = `${path}/projects/${projectId}/data/${response.data.data_id}/annotate`;
        } 
      })
      .catch(() => {
        this.setState({
          isProjectLoading: false
        });
      });
  }

  onChange(e) {
    this.setState({ apicode: e.target.value });
  }

  handleUploadToAddProject() {
    const {apicode} = this.state
    console.log(apicode)
    axios({
      method: 'post',
      url: `api/projects/user_add_project`,
      data: {
        apicode: apicode,
      }
    })
      .then(response => {
        if (response.status == 200) {
          window.location.reload();
        } 

        if (response.status == 205) {
          this.setState({
            errorMessage: "Incorrect Api Code, contact system admin for the correct code"
          });
        } 
      })
      .catch(response => {
        console.log(response.status)
        this.setState({
          errorMessage: "BAD SEVER ERROR CONTACT SYSTEM ADMIN"
        });
       
      });
  }

  handleAlertDismiss(e) {
    //e.preventDefault();
    this.setState({
      successMessage: '',
      errorMessage: ''
    });
  }

  render() {
    const { isProjectLoading, projects,errorMessage, successMessage } = this.state;
    return (
      <div>
        <Helmet>
          <title>Dashboard</title>
        </Helmet>
        <div className="container h-100">
        <Modal
          show={this.state.show}
          onExited={() => {
            this.handleAlertDismiss()
            this.setState({
            show: false
          })}}
          onHide={() => {
            this.handleAlertDismiss()
            this.setState({
            show: false
          })}}
          size="lg"
          aria-labelledby="contained-modal-title-vcenter"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">{"Add a project!"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <form
            name="new_user"
            ref={el => {
              this.form = el;
            }}
          >
            <FormAlerts
              errorMessage={errorMessage}
              successMessage={successMessage}
              callback={e => this.handleAlertDismiss(e)}
            />
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                id="username"
                placeholder="api code"
                autoFocus
                required
                onChange={e => this.onChange(e)}
              />
            </div>
            <div className="form-row">
              <div className="form-group col">
                <Button
                  size="lg"
                  type="primary"
                  //disabled={!!isSubmitting}
                  onClick={e => this.handleUploadToAddProject(e)}
                  //isSubmitting={isSubmitting}
                  text="Upload Project!"
                />
              </div>
            </div>
          </form>
          </Modal.Body>
        </Modal>




          <div className="h-100 mt-5">
            <div className="row border-bottom my-3">
              <div className="float-left">
                <h1>Projects</h1>
              </div>
              <IconButton 
                icon={faPlusCircle}
                type="primary"
                size="lg"
                  onClick={() => this.setState({
                    show: true
                  })
                  }
                title="Add a project!">
              </IconButton>
              
              <hr />
              {!isProjectLoading && projects.length > 0 ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Name</th>
                      <th scope="col">Created By</th>
                      <th scope="col">Quick Start</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project, index) => {
                      return (
                        <tr key={index}>
                          <th scope="row" className="align-middle">
                            {index + 1}
                          </th>
                          <td className="align-middle">
                            <a href={`/projects/${project.project_id}/data`}>{project.name}</a>
                          </td>
                          <td className="align-middle">{project.created_by}</td>
                          <td className="align-middle">
                            <Button
                              type="primary"
                              text="Quick Start Annotating"
                              onClick={() => this.getReccomendedData(project.project_id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : null}
            </div>
            <div className="row my-4 justify-content-center align-items-center">
              {isProjectLoading ? <Loader /> : null}
              {!isProjectLoading && projects.length === 0 ? (
                <div className="font-weight-bold">No projects exists!</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Dashboard;
