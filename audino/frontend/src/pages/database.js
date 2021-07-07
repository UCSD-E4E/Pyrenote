import axios from 'axios';
import React from 'react';
import { Helmet } from 'react-helmet';
import { withRouter } from 'react-router-dom';
import { IconButton, Button } from '../components/button';

import Loader from '../components/loader';

class Database extends React.Component {
  constructor(props) {
    super(props);

    const projectId = Number(this.props.match.params.id);

    const { location } = this.props;
    const params = new URLSearchParams(location.search);
    this.state = {
      projectId,
      data: [],
      count: {
        pending: 0,
        completed: 0,
        all: 0,
        marked_review: 0
      },
      apiUrl: `/api/current_user/projects/${projectId}/data`,
      isDataLoading: false
    };
  }

  // USE TO GET ALL THE DATA SORTED BY PROJECTS
  omponentDidMount() {
    this.setState({ isDataLoading: true });
    let { apiUrl } = this.state;
    apiUrl = `/current_user/projects/get_all`;
    axios({
      method: 'get',
      url: apiUrl
    })
      .then(response => {
        const { data } = response.data;
        this.setState({
          data,
          isDataLoading: false
        });
      })
      .catch(error => {
        this.setState({
          errorMessage: error.response.data.message,
          isDataLoading: false
        });
      });
  }

  // uhhhhhhh
  select() {
    console.log('hi');
  }

  collaspable() {
    const coll = document.getElementsByClassName('table table-striped text-center');
    var i = 0;
    for (var i = 0; i + 1 > coll.length; i++) {
      coll[i].addEventListener('click', function () {
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        if (content.style.maxHeight) {
          content.style.maxHeight = null;
        } else {
          content.style.maxHeight = `${content.scrollHeight}px`;
        }
      });
    }
  }

  render() {
    /**
     * Goals to implement
     *      Get buttons to select rows
     *      Get Button to upload daata
     *      Get button to trash data
     *      be able to pull data from rows?
     */

    // NOTE TO SELF, IF THE DATA ISN"T LOADING CHECK THE LENGTH OF THE DATA TO MAKE SURE IT IS IN THE RIGHT FORMAT VIA DATA.LENGTH (should be a value not undefined)
    this.state.isDataLoading = true;
    let { apiUrl } = this.state;
    if (this.state.data == 0) {
      // apiUrl = `${apiUrl}?page=${page}&active=${active}`;
      apiUrl = '/api/current_user/projects/get_all';
      console.log('hello there');
      axios({
        method: 'get',
        url: apiUrl
      })
        .then(response => {
          const { data } = response.data;
          this.setState({
            data,
            isDataLoading: false
          });
          console.log('hello there');
        })
        .catch(error => {
          this.setState({
            errorMessage: error.response.data.message,
            isDataLoading: false
          });
        });
    }
    const { data } = this.state;
    const projectId = 1;
    console.log(data.length);
    if (data.length > 0) {
      this.state.isDataLoading = false;
    }

    console.log(this.state.isDataLoading);
    return (
      <div>
        <Helmet>
          <title>Page Title</title>
        </Helmet>
        <div className="container h-100">
          <div className="h-100 mt-5">
            <div className="row border-bottom my-3">
              <div className="col float-left">
                <h1>Data</h1>
              </div>
            </div>
            {!this.state.isDataLoading ? (
              <div>
                <div className="col float-left">
                  <h1>Data</h1>
                  <Button
                    size="lg"
                    type="primary"
                    onClick={e => this.collaspable(e)}
                    text="expand"
                  />
                </div>
                {data.length > 0 ? (
                  <table className="table table-striped text-center">
                    <thead>
                      <tr>
                        <th scope="col">Select</th>
                        <th scope="col">File Name</th>
                        <th scope="col">No. of segmentations</th>
                        <th scope="col">Created On</th>
                        <th scope="col">Trash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((data, index) => {
                        console.log('made it here');
                        return (
                          <tr key={index}>
                            <td className="align-middle">
                              <Button
                                size="lg"
                                type="primary"
                                onClick={e => this.select(e)}
                                text="Select"
                              />
                            </td>
                            <td className="align-middle">{data.original_filename}</td>
                            <td className="align-middle">{data.number_of_segmentations}</td>
                            <td className="align-middle">{data.created_on}</td>
                            <td className="align-middle">
                              <Button
                                size="lg"
                                type="primary"
                                onClick={e => this.select(e)}
                                text="Trash"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}
export default withRouter(Database);
