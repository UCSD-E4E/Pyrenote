import axios from 'axios';
import React from 'react';
import { Helmet } from 'react-helmet';
import { withRouter } from 'react-router-dom';

import Loader from '../components/loader';

const datas = [];

/**
 * Data React Component
 * Given a spefific project, list the audio data in said project
 * Display audio data in a table so user can access the files
 */
class Data extends React.Component {
  constructor(props) {
    super(props);
    const { location, match } = this.props;
    const projectId = Number(match.params.id);
    const params = new URLSearchParams(location.search);
    /**
     * Explaination of key state variables
     * Active desribes the type of audio clips to anntoate:
     *  - pending
     *  - completed
     *  - all
     *  - those marked for review
     *  - those marked not confident
     *  - and those that are retired form processing
     */
    
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

  /**
   * When page loads
   * Get the data from the backend for the frist 10 audio clips
   * Assign events to check if user each the bottom so more data can be loaded in
   * Tracking bottom of scroll code found here:
   * https://stackoverflow.com/questions/45585542/detecting-when-user-scrolls-to-bottom-of-div-with-react-js
   */
  componentDidMount() {
    this.setState({ isDataLoading: true });
    this.getData();
    document.body.addEventListener('scroll', this.trackScrolling);
  }

  /**
   * Remove scrolling when page deloads so we don't always ping backend when scrolling
   */
  componentWillUnmount() {
    document.body.addEventListener('scroll', this.trackScrolling);
  }

  /**
   * Get a batch of ten audio files of the given active
   * Runs when page loads, and user needs more data via scrolling
   */
  getData() {
    let { apiUrl, page, data } = this.state;
    const { active } = this.state;

    //prep url for given batch number (page) and active
    localStorage.setItem('active', active);
    page += 1;
    apiUrl = `${apiUrl}?page=${page}&active=${active}`;
    
    
    axios({
      method: 'get',
      url: apiUrl
    })
      .then(response => {
        //get data from backend
        const { count, active, next_page } = response.data;
        const next_page_data = response.data.data;

        //add files list to list of existing file links
        data = data.concat(next_page_data);

        //update the state with the new data points
        this.setState({
          data,
          count,
          active,
          page,
          nextPage: next_page,
          isDataLoading: false
        });

        /* EDGE CASE
          If the user screen is so big that the scroll wheel cannot appears
          Then new data cannot be laoded in
          to fix this, recusrively call the method to keep generating new data so the scroll can appear
         */
        if (next_page && this.isScrollLessThanWindow()) {
          this.getData();
        }
      })
      .catch(error => {
        //standard error handling
        console.error(error);
        this.setState({
          isDataLoading: false
        });
      });
  }

  /*
    check if user has hit bottom of the screen
    and there is another page of data to load
    nextPage is false if all data of set active type is loaded on user's page
  */
  trackScrolling = () => {
    const { nextPage } = this.state;
    if (this.isBottom() && nextPage) {
      this.getData();
    }
  };

  /**
   * Check if the scroll wheel can appear on the page
   * @returns scroll wheel does not exist yet
   */
  isScrollLessThanWindow() {
    const yMax = document.body.scrollHeight - document.body.clientHeight;
    return yMax <= document.body.clientHeight * 0.05;
  }

  /**
   * @returns if user's scroll is CLOSE to the bottom of the page
   * @code_soruces https://stackoverflow.com/questions/3898130/check-if-a-user-has-scrolled-to-the-bottom/3898152 
   */
  isBottom() {
    const element = document.body;
    //DETERMINE IF USER SCROLLS WITHIN 5% OF BOTTOM
    return element.scrollHeight - element.scrollTop <= element.clientHeight + element.clientHeight * 0.05;
  }

  /**
   * 
   * @param {*} projectId 
   * @param {*} page 
   * @param {*} active 
   * @returns url to get more data
   */
  prepareUrl(projectId, page, active) {
    return `/projects/${projectId}/data?page=${page}&active=${active}`;
  }

  render() {
    const element = document.body;
    console.log(element.scrollHeight - element.scrollTop,  element.clientHeight)
    //Reset code to handle going to previous clips without reloading the page
    //TODO: FIX THIS SO USERS CAN GO BACK TO A PREVIOUS LINK IF THEY SO WISH WITHOUT MUCH ISSUES
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
                {/** this header is for being able to swap between actives */}
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
                    {/** Data for the selected active is shown here */}
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
                      {/**display text if there is no more data to load in */}
                      <b>End Of Data</b>
                    </text>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Data);
export const dataLinks = datas;
