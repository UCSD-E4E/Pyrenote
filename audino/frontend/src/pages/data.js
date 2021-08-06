import axios from 'axios';
import React from 'react';
import { Helmet } from 'react-helmet';
import { withRouter } from 'react-router-dom';

import Loader from '../components/loader';

const datas = [];

class Data extends React.Component {
  constructor(props) {
    super(props);
    const { location, match } = this.props;
    const projectId = Number(match.params.id);

    const params = new URLSearchParams(location.search);
    this.state = {
      projectId,
      data: [],
      active: params.get('active') || 'pending',
      page: params.get('page') || 1,
      count: {
        pending: 0,
        completed: 0,
        all: 0,
        marked_review: 0
      },
      apiUrl: `/api/current_user/projects/${projectId}/data`,
      tabUrls: {
        pending: this.prepareUrl(projectId, 1, 'pending'),
        completed: this.prepareUrl(projectId, 1, 'completed'),
        all: this.prepareUrl(projectId, 1, 'all'),
        marked_review: this.prepareUrl(projectId, 1, 'marked_review')
      },
      nextPage: null,
      prevPage: null,
      isDataLoading: false
    };
  }

  componentDidMount() {
    this.setState({ isDataLoading: true });
    let { apiUrl } = this.state;
    let { page, active } = this.state;
    apiUrl = `${apiUrl}?page=${page}&active=${active}`;

    axios({
      method: 'get',
      url: apiUrl
    })
      .then(response => {
        const { data, count, next_page, prev_page } = response.data;
        page = response.data.page;
        active = response.data.active;
        this.setState({
          data,
          count,
          active,
          page,
          nextPage: next_page,
          prevPage: prev_page,
          isDataLoading: false
        });
      })
      .catch(error => {
        console.error(error);
        this.setState({
          isDataLoading: false
        });
      });
  }

  getNextPage() {
    const { projectId, data } = this.state;

    return { projectId, data };
  }

  prepareUrl(projectId, page, active) {
    return `/projects/${projectId}/data?page=${page}&active=${active}`;
  }

  render() {
    localStorage.setItem('previous_links', JSON.stringify([]));
    localStorage.setItem('count', JSON.stringify(0));
    const { projectId, isDataLoading, data, count, active, page, nextPage, prevPage, tabUrls } =
      this.state;
    const nextPageUrl = this.prepareUrl(projectId, nextPage, active);
    const prevPageUrl = this.prepareUrl(projectId, prevPage, active);

    return (
      <div>
        <Helmet>
          <title>Data</title>
        </Helmet>
        <div className="container h-100">
          <div className="h-100 mt-5">
            <div className="row border-bottom my-3">
              <div className="col float-left">
                <h1>Data</h1>
              </div>
            </div>
            {!isDataLoading ? (
              <div>
                <div className="col justify-content-left my-3">
                  <ul className="nav nav-pills nav-fill">
                    <li className="nav-item">
                      <a
                        className={`nav-link ${active === 'pending' ? 'active' : null}`}
                        href={tabUrls.pending}
                      >
                        Yet to annotate ({count.pending})
                      </a>
                    </li>
                    <li className="nav-item">
                      <a
                        className={`nav-link ${active === 'completed' ? 'active' : null}`}
                        href={tabUrls.completed}
                      >
                        Annotated ({count.completed})
                      </a>
                    </li>
                    <li className="nav-item">
                      <a
                        className={`nav-link ${active === 'all' ? 'active' : null}`}
                        href={tabUrls.all}
                      >
                        All ({count.all})
                      </a>
                    </li>
                    <li className="nav-item">
                      <a
                        className={`nav-link ${active === 'marked_review' ? 'active' : null}`}
                        href={tabUrls.marked_review}
                      >
                        Marked for review ({count.marked_review})
                      </a>
                    </li>
                  </ul>
                </div>
                {data.length > 0 ? (
                  <table className="table table-striped text-center">
                    <thead>
                      <tr>
                        <th scope="col">File Name</th>
                        <th scope="col">No. of segmentations</th>
                        <th scope="col">Created On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, index) => {
                        return (
                          <tr key={index}>
                            <td className="align-middle">
                              <a href={`/projects/${projectId}/data/${item.data_id}/annotate`}>
                                {item.original_filename}
                              </a>
                            </td>
                            <td className="align-middle">{item.number_of_segmentations}</td>
                            <td className="align-middle">{item.created_on}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="row my-4 justify-content-center align-items-center">
            {isDataLoading ? <Loader /> : null}
            {!isDataLoading && data.length === 0 ? (
              <div className="font-weight-bold">No data exists!</div>
            ) : null}
          </div>
          <div className="col-12 my-4 justify-content-center align-items-center text-center">
            {prevPage ? (
              <a className="col" href={prevPageUrl}>
                Previous
              </a>
            ) : null}

            {data.length !== 0 ? <span className="col">{page}</span> : null}
            {nextPage ? (
              <a className="col" href={nextPageUrl}>
                Next
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Data);
export function getData() {
  Data.getNextPage();
}
export const dataLinks = datas;
