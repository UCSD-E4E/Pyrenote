import axios from 'axios';
import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '../components/button';

import Loader from '../components/loader';
import { errorLogger } from '../logger';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      isProjectLoading: false
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

  render() {
    const { isProjectLoading, projects } = this.state;
    return (
      <div>
        <Helmet>
          <title>Dashboard</title>
        </Helmet>
        <div className="container h-100">
          <div className="h-100 mt-5">
            <div className="row border-bottom my-3">
              <div className="col float-left">
                <h1>Projects</h1>
              </div>
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
