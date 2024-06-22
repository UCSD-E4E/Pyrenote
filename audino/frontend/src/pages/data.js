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
      page: 0,
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
        marked_review: this.prepareUrl(projectId, 1, 'marked_review'),
        not_confident: this.prepareUrl(projectId, 1, 'not_confident'),
        retired: this.prepareUrl(projectId, 1, 'retired')
      },
      nextPage: null,
      isDataLoading: false
    };
  }

  // code below from
  // https://stackoverflow.com/questions/45585542/detecting-when-user-scrolls-to-bottom-of-div-with-react-js
  componentDidMount() {
    this.setState({ isDataLoading: true });
    this.getData();
    localStorage.setItem('projectId', this.state.projectId); // Store projectId in local storage
    document.body.addEventListener('scroll', this.trackScrolling);
    document.body.addEventListener('scroll', () => {});
  }

  componentWillUnmount() {
    document.body.addEventListener('scroll', this.trackScrolling);
  }

  getData() {
    let { apiUrl, page, data } = this.state;
    const { active } = this.state;
    localStorage.setItem('active', active);
    page += 1;
    apiUrl = `${apiUrl}?page=${page}&active=${active}`;
    axios({
      method: 'get',
      url: apiUrl
    })
      .then(response => {
        const { count, active, next_page } = response.data;
        const next_page_data = response.data.data;
        data = data.concat(next_page_data);

        this.setState({
          data,
          count,
          active,
          page,
          nextPage: next_page,
          isDataLoading: false
        });
        if (next_page && this.isScrollLessThanWindow()) {
          this.getData();
        }
      })
      .catch(error => {
        console.error(error);
        this.setState({
          isDataLoading: false
        });
      });
  }

  trackScrolling = () => {
    const element = document.body;
    const { nextPage } = this.state;
    if (this.isBottom() && nextPage) {
      // this.setState({ isDataLoading: true });
      this.getData(true);
    }
  };

  isScrollLessThanWindow() {
    const yMax = document.body.scrollHeight - document.body.clientHeight;
    return yMax <= document.body.clientHeight * 0.05;
  }

  isBottom() {
    // https://stackoverflow.com/questions/3898130/check-if-a-user-has-scrolled-to-the-bottom/3898152
    const element = document.body;
    //DETERMINE IF USER SCROLLS WITHIN 5% OF BOTTOM
    return element.scrollHeight - element.scrollTop <= element.clientHeight + element.clientHeight * 0.05;
  }

  prepareUrl(projectId, page, active) {
    return `/projects/${projectId}/data?page=${page}&active=${active}`;
  }

  render() {
    const element = document.body;
    console.log(element.scrollHeight - element.scrollTop,  element.clientHeight)
    localStorage.setItem('previous_links', JSON.stringify([]));
    localStorage.setItem('count', JSON.stringify(0));
    const { projectId, isDataLoading, data, count, active, nextPage, tabUrls } = this.state;

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
                      {this.props.showRetired? <li className="nav-item">                    
                      <a
                        className={`nav-link ${active === 'retired' ? 'active' : null}`}
                        href={tabUrls.retired}
                      >
                        RETIRED CLIPS ({count.retired})
                      </a>
                    </li> : null}
                  </ul>
                </div>
                {data.length > 0 ? (
                  <table className="table table-striped text-center">
                    <thead>
                      <tr>
                        <th scope="col">File Name</th>
                        <th scope="col">No. of segmentations</th>
                        <th scope="col">Confidence</th>
                        <th scope="col">Number Reviewed</th>
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
                            <td className="align-middle">{item.confidence}</td>
                            <td className="align-middle">{item.num_users_viewed}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : null}
                <div
                  className="button-container"
                  style={{
                    position: 'relative',
                    justifyItems: 'center',
                    left: '50%',
                    paddingBottom: '50px'
                  }}
                >
                  {nextPage ? (
                    <Loader />
                  ) : (
                    <text>
                      <b>End Of Data</b>
                    </text>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* <div className="col-12 my-4 justify-content-center align-items-center text-center">
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
            </div> */}
        </div>
      </div>
    );
  }
}

export default withRouter(Data);
export const dataLinks = datas;
